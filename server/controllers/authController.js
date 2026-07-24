import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const sendOtpMail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your OUDS account",
    html: `
      <h2>OUDS Email Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
    `,
  });
};

export const register = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        msg: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        msg: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    let user;

    if (existingUser && !existingUser.isVerified) {
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpires = new Date(
        Date.now() + 10 * 60 * 1000
      );
      existingUser.authProvider = "local";

      user = await existingUser.save();
    } else {
      user = await User.create({
        email,
        password: hashedPassword,
        otp,
        otpExpires: new Date(Date.now() + 10 * 60 * 1000),
        isVerified: false,
        authProvider: "local",
      });
    }

    await sendOtpMail(email, otp);

    console.log("OTP sent to:", email);
    console.log("OTP:", otp);

    res.json({
      msg: "OTP sent to your email",
      email: user.email,
      needOtp: true,
    });

  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      msg: "Registration failed",
      error: error.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const otp = String(req.body.otp || "").trim();

    console.log("Entered email:", email);
    console.log("Entered OTP:", otp);

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    console.log("Saved OTP:", user.otp);
    console.log("Verified:", user.isVerified);
    console.log("OTP expires:", user.otpExpires);

    if (user.isVerified) {
      return res.status(400).json({
        msg: "Email already verified. Please login.",
      });
    }

    if (String(user.otp).trim() !== otp) {
      return res.status(400).json({
        msg: "Invalid OTP",
      });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({
        msg: "OTP expired. Please register again.",
      });
    }

    user.isVerified = true;
    user.otp = "";
    user.otpExpires = null;

    await user.save();

    const token = signToken(user);

    res.json({
      msg: "Email verified successfully",
      token,
      user: {
        _id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });

  } catch (error) {
    console.error("OTP verify error:", error);

    res.status(500).json({
      msg: "OTP verification failed",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        msg: "Please verify your email first",
      });
    }

    if (user.authProvider === "google") {
      return res.status(400).json({
        msg: "Please login with Google",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        msg: "Invalid password",
      });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      msg: "Login failed",
      error: error.message,
    });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        msg: "Google credential missing",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload.email.toLowerCase();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        isVerified: true,
        authProvider: "google",
      });
    }

    user.isVerified = true;
    user.authProvider = "google";

    await user.save();

    const token = signToken(user);

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });

  } catch (error) {
    console.error("Google login error:", error);

    res.status(500).json({
      msg: "Google login failed",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    await sendOtpMail(email, otp);

    res.json({ msg: "OTP sent to your email", email: user.email, needOtp: true });
  } catch (error) {
    res.status(500).json({ msg: "Failed to send reset email", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ msg: "All fields are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (String(user.otp).trim() !== otp.trim()) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ msg: "OTP has expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = "";
    user.otpExpires = null;
    await user.save();

    res.json({ msg: "Password reset successful! You can now login.", success: true });
  } catch (error) {
    res.status(500).json({ msg: "Failed to reset password", error: error.message });
  }
};