import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import PatientRecord from "../models/PatientRecord.js";
import verifyToken from "../middleware/authMiddleware.js";
import { generateReport } from "../templates/report_templates.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREDICT_SCRIPT = path.resolve(__dirname, "../../model/predict.py");

// Gemini is kept ONLY for follow-up chat, not primary diagnosis
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const uploadToCloudinary = async (base64Image) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_UPLOAD_PRESET) {
    return base64Image;
  }
  try {
    const formData = new URLSearchParams();
    formData.append("file", base64Image);
    formData.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url || base64Image;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return base64Image;
  }
};

// ─── Local Model Prediction ─────────────────────────────────────────────────

const predictWithLocalModel = (patientData) => {
  return new Promise((resolve, reject) => {
    const inputJson = JSON.stringify(patientData);

    const child = execFile("python", [PREDICT_SCRIPT], {
      timeout: 15000,
      maxBuffer: 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (error) {
        console.error("Model prediction error:", error.message);
        return reject(new Error("Local model prediction failed: " + error.message));
      }
      try {
        const result = JSON.parse(stdout.trim());
        if (!result.success) {
          return reject(new Error(result.error || "Prediction returned failure"));
        }
        resolve(result);
      } catch (parseErr) {
        console.error("Failed to parse model output:", stdout);
        reject(new Error("Failed to parse model output"));
      }
    });

    // Send patient data via stdin
    child.stdin.write(inputJson);
    child.stdin.end();
  });
};

// ─── Gemini for follow-up chat only ─────────────────────────────────────────

const callGeminiChat = async (contents) => {
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 2048,
        },
      });
      const response = await model.generateContent(contents);
      const candidate = response.response.candidates?.[0];
      let text = response.response.text();

      const finishReason = candidate?.finishReason;
      if (finishReason === "MAX_TOKENS" || finishReason === "RECITATION") {
        console.warn("Chat response truncated. Requesting continuation...");
        try {
          const contPrompt = `The following response was cut off. Please complete it:\n\n${text}\n\nPlease continue from where it stopped:`;
          const contResponse = await model.generateContent(contPrompt);
          text = text + "\n" + contResponse.response.text();
        } catch (contErr) {
          console.warn("Chat continuation failed.", contErr.message);
        }
      }

      return text;
    } catch (err) {
      console.warn(`Gemini chat attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, 1500 * attempt));
      }
    }
  }
  throw lastError || new Error("AI chat service unavailable. Please try again.");
};

// ─── Gemini Vision for Image Analysis ───────────────────────────────────────

const callGeminiVision = async (contents) => {
  const maxRetries = 5;
  let lastError = null;

  const getModel = () => genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 4096,
    },
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = getModel();
      const response = await model.generateContent(contents);
      const candidate = response.response.candidates?.[0];
      let text = response.response.text();

      const finishReason = candidate?.finishReason;
      if (finishReason === "MAX_TOKENS" || finishReason === "RECITATION") {
        console.warn("Response truncated (finishReason:", finishReason, "). Requesting continuation...");
        try {
          const contModel = getModel();
          const contPrompt = `The following is a partial medical diagnostic report that was cut off. Please complete the remaining sections based on the context:\n\n${text}\n\nPlease continue from where it stopped:`;
          const contResponse = await contModel.generateContent(contPrompt);
          text = text + "\n" + contResponse.response.text();
        } catch (contErr) {
          console.warn("Continuation failed, using partial response.", contErr.message);
        }
      }

      if (!text || text.trim().length < 100) {
        throw new Error("Response was too short or empty. Retrying...");
      }

      return text;
    } catch (err) {
      console.warn(`Gemini Vision attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.min(1500 * attempt, 8000);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  throw lastError || new Error("AI service is currently under high demand. Please wait a moment and try again.");
};

// ─── Analyze Endpoint ───────────────────────────────────────────────────────

router.post("/analyze", verifyToken, async (req, res) => {
  try {
    const {
      messages,
      systemPrompt,
      symptoms,
      patientName,
      image,
      saveRecord = true,
    } = req.body;

    // ─── Follow-up chat (saveRecord=false) → use Gemini ─────
    if (saveRecord === false) {
      const userPrompt = messages?.map((m) => m.content).join("\n\n") || "Follow-up question.";
      const finalPrompt = `${systemPrompt}\n\nPatient Information:\n${userPrompt}`;
      const chatResult = await callGeminiChat([finalPrompt]);
      return res.json({ success: true, result: chatResult });
    }

    // ─── Primary diagnosis (Hybrid Router) ──────────────────
    let result = "";
    let riskLevel = "UNKNOWN";
    let urgency = "ROUTINE";
    let modelInfo = null;

    if (image && typeof image === "string" && image.startsWith("data:")) {
      console.log("[MODEL] Image detected. Routing to Gemini Vision...");
      
      const userPrompt = messages?.map((m) => m.content).join("\n\n") || "Analyze oral ulcer symptoms and photo.";
      const finalPrompt = `${systemPrompt}\n\nPatient Information:\n${userPrompt}`;
      
      let promptContents = [finalPrompt];
      const matches = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches) {
        promptContents.push({
          inlineData: {
            data: matches[2],
            mimeType: matches[1],
          },
        });
      }
      
      result = await callGeminiVision(promptContents);
      
      const riskMatch = result.match(/RISK LEVEL:\s*([^\n]+)/i);
      if (riskMatch) riskLevel = riskMatch[1].trim();
      
      const urgencyMatch = result.match(/URGENCY:\s*([^\n]+)/i);
      if (urgencyMatch) urgency = urgencyMatch[1].trim();
      
      modelInfo = {
        diagnosis: "Gemini Multimodal",
        confidence: 1.0,
        topPredictions: [],
        modelVersion: "gemini-2.5-flash",
      };
      
    } else {
      console.log("[MODEL] No image. Routing to Local XGBoost model for:", patientName);

      const prediction = await predictWithLocalModel(symptoms || {});

      console.log("[MODEL] Prediction:", prediction.primary_diagnosis,
        "| Confidence:", (prediction.confidence * 100).toFixed(1) + "%");

      result = generateReport(
        prediction.primary_diagnosis,
        prediction.confidence,
        prediction.top_predictions,
        prediction.risk_level,
        prediction.urgency,
        symptoms || {}
      );
      
      riskLevel = prediction.risk_level;
      urgency = prediction.urgency;
      
      modelInfo = {
        diagnosis: prediction.primary_diagnosis,
        confidence: prediction.confidence,
        topPredictions: prediction.top_predictions,
        modelVersion: prediction.model_version,
      };
    }

    // Handle image upload
    let savedImageUrl = "";
    if (image && typeof image === "string" && image.startsWith("data:")) {
      savedImageUrl = await uploadToCloudinary(image);
    }

    // Save to database
    const validUserId = req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)
      ? req.user.id
      : null;

    const record = await PatientRecord.create({
      patientName: patientName || "Anonymous",
      symptoms: symptoms || {},
      diagnosis: result,
      aiResponse: result,
      riskLevel: riskLevel,
      urgency: urgency,
      user: validUserId,
      userEmail: req.user.email,
      imageUrl: savedImageUrl,
    });

    res.json({
      success: true,
      result,
      record,
      modelInfo: modelInfo,
    });

  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ─── Records ────────────────────────────────────────────────────────────────

router.get("/records", verifyToken, async (req, res) => {
  try {
    const filter = req.user.isAdmin ? {} : { user: req.user.id };
    const records = await PatientRecord.find(filter).sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error("Records error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/records/:id", verifyToken, async (req, res) => {
  try {
    const filter = req.user.isAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user.id };

    const deleted = await PatientRecord.findOneAndDelete(filter);

    if (!deleted) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }

    res.json({ success: true, msg: "Record deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;