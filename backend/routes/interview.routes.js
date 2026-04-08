import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { generateInterviewReportController } from "../controllers/interview.controller.js";
import upload from "../middlewares/file.middleware.js";
const router = express.Router();
router.post("/", protect, upload.single("resume") , generateInterviewReportController)



export default router