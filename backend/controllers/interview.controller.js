import { createRequire } from "module";
const require = createRequire(import.meta.url);

const pdfParse = require("pdf-parse");

import { generateInterviewReport, generateResumePdf } from "../services/ai.service.js";
import interviewReportModel from "../models/interviewReport.model.js";

export const generateInterviewReportController = async (req, res) => {
  try {
    console.log("USER:", req.user);

    if (!req.file && !req.body.selfDescription) {
      return res.status(400).json({
        message: "Resume or Self Description required"
      });
    }

    let resumeText = "";

    if (req.file) {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text;
    }

    const { jobDescription, selfDescription } = req.body;

    const interviewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription
    });

const titleMatch = jobDescription?.match(/Job Title:\s*(.*)/i);
const fallbackTitle = titleMatch ? titleMatch[1] : "Untitled Role";

const interviewReport = await interviewReportModel.create({
  user: req.user?._id,
  resume: resumeText,
  selfDescription,
  jobDescription,
  ...interviewReportByAi,
  title: interviewReportByAi.title || fallbackTitle
});

    res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const getInterviewReportByIdController = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id
    });

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found."
      });
    }

    res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const generateResumePdfController = async (req, res) => {
  try {
    const { interviewId } = req.params;

const interviewReport = await interviewReportModel.findOne({
  _id: interviewId,
  user: req.user.id
});
    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found."
      });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription
    });

    res.set({
      "Content-Type": "application/pdf",
"Content-Disposition": `attachment; filename=resume_${interviewId}.pdf`    });

    res.send(pdfBuffer);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllInterviewReportsController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const interviewReports = await interviewReportModel
      .find({ user: req.user?._id })
      .sort({ createdAt: -1 })
      .select("-resume -selfDescription -jobDescription -__v");

    res.status(200).json({
      message: "Interview reports retrieved successfully",
      interviewReports
    });

  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteReportController = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const report = await interviewReportModel.findOneAndDelete({
      _id: interviewId,
      user: req.user.id
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({
      message: "Report deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};