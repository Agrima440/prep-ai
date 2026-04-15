import dotenv from "dotenv";
dotenv.config(); // MUST BE FIRST LINE

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";           
import "./config/passport.js";            
import authRoutes from "./routes/auth.routes.js";
import interviewRoute from "./routes/interview.routes.js";
import { connectDB } from "./config/db.js";
// import { invokeGeminiAi } from "./services/ai.service.js";
// import { generateInterviewReport } from "./services/ai.service.js";
// import {resume, jobDescription, selfDescription } from "./services/temp.js";



connectDB();
// generateInterviewReport({resume, selfDescription, jobDescription})
// invokeGeminiAi();
const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://prep-ai-beige.vercel.app",
  credentials: true
}));
app.options("*", cors());

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running 🚀",
    time: new Date()
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
