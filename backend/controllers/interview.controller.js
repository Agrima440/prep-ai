import { generateInterviewReport } from "../services/ai.service.js";
import interviewReportModel from "../models/interviewReport.model.js";
import User from "../models/User.js";


export const generateInterviewReportController = async (req, res) => {
const resumeContent = await (new pdfParse.PDFParse(req.file.buffer)).getText();   
const { jobDescription, selfDescription } = req.body;
const interviewReportByAi=await generateInterviewReport({
    resume:resumeContent.text,
    selfDescription,
    jobDescription
})
const interviewReport = await interviewReportModel.create({
  user: req.user._id,   // ⚠️ lowercase 'user'
  resume: resumeContent.text,
  selfDescription,
  jobDescription,
  ...interviewReportByAi
});

res.status(201).json({
    message: "Interview report generated successfully",
    interviewReport 
})
}