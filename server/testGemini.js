import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

console.log("Key loaded:", process.env.GEMINI_API_KEY?.slice(0, 10));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent("Say hello");
    console.log(result.response.text());
  } catch (error) {
    console.log("Gemini test failed:");
    console.log(error.message);
  }
}

test();