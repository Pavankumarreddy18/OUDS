import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import {
  login,
  register,
  verifyOtp,
  googleLogin,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

const ADMIN_EMAIL = "admin@ulcerai.com";
const ADMIN_PASSWORD = "admin123";

router.post(
  "/login",
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (
        email === ADMIN_EMAIL &&
        password === ADMIN_PASSWORD
      ) {
        let adminUser = await User.findOne({ email: ADMIN_EMAIL });
        if (!adminUser) {
          adminUser = await User.create({
            email: ADMIN_EMAIL,
            isVerified: true,
            isAdmin: true,
          });
        } else if (!adminUser.isAdmin) {
          adminUser.isAdmin = true;
          await adminUser.save();
        }

        const token = jwt.sign(
          {
            id: adminUser._id,
            email: ADMIN_EMAIL,
            isAdmin: true,
          },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        return res.json({
          token,
          user: {
            _id: adminUser._id,
            email: ADMIN_EMAIL,
            isAdmin: true,
          },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  },
  login
);

router.post("/register", register);

router.post("/verify-otp", verifyOtp);

router.post("/google", googleLogin);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

export default router;