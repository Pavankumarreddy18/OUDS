// FullStack/server/server.js  (updated)
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import ulcerRoutes from "./routes/ulcer.js";  // ← new

dotenv.config();
console.log(process.env.GEMINI_API_KEY);

const app = express();
app.use(cors({
    origin: "*"
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/ulcer", ulcerRoutes);   // ← new

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
