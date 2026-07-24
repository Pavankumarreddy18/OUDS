import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

console.log("Trying to connect with:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.log("❌ Connection failed:", err.message);
    process.exit(1);
  });