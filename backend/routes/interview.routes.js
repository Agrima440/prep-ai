import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  deleteReportController,
  generateInterviewReportController,
  generateResumePdfController,
  getAllInterviewReportsController,
  getInterviewReportByIdController
} from "../controllers/interview.controller.js";
import upload from "../middlewares/file.middleware.js";

const router = express.Router();

router.post("/", protect, upload.single("resume"), generateInterviewReportController);
router.get("/report/:interviewId", protect, getInterviewReportByIdController);
router.get("/", protect, getAllInterviewReportsController);
router.get("/resume/pdf/:interviewId", protect, generateResumePdfController);
router.delete("/:interviewId", protect, deleteReportController);
export default router;