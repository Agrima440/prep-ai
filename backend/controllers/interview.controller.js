import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

import { generateInterviewReport } from "../services/ai.service.js";
import interviewReportModel from "../models/interviewReport.model.js";

export const generateInterviewReportController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json("Resume file required");
    }

    const pdfData = await pdfParse(req.file.buffer);

    const { jobDescription, selfDescription } = req.body;

    const interviewReportByAi = await generateInterviewReport({
      resume: pdfData.text,
      selfDescription,
      jobDescription
    });

    const interviewReport = await interviewReportModel.create({
      user: req.user._id,
      resume: pdfData.text,
      selfDescription,
      jobDescription,
      ...interviewReportByAi
    });

    res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport
    });

  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json(err.message || "Server error");
  }
};