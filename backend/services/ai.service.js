import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import puppeteer from "puppeteer";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

const interviewReportSchema = z.object({
  matchScore: z.number(),
  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string()
    })
  ),
  behavioralQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string()
    })
  ),
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      severity: z.enum(["low", "medium", "high"])
    })
  ),
  preparationPlan: z.array(
    z.object({
      day: z.number(),
      focus: z.string(),
      tasks: z.array(z.string())
    })
  ),
  title: z.string()
});

// ✅ INTERVIEW REPORT
export async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

 const prompt = `
You are an expert interviewer.

Generate a detailed interview report.

STRICT RULES:
- matchScore must be a number between 0 to 100
- title must be a short job title (e.g., "Full Stack Developer")
- Return ONLY valid JSON

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", // ✅ FIXED MODEL
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(interviewReportSchema),
    }
  });

const parsed = JSON.parse(response.text);

return {
  matchScore: parsed.matchScore ?? 0, // ✅ fallback
  title: parsed.title || "Untitled Role",
  technicalQuestions: parsed.technicalQuestions || [],
  behavioralQuestions: parsed.behavioralQuestions || [],
  skillGaps: parsed.skillGaps || [],
  preparationPlan: parsed.preparationPlan || []
};}


// ✅ PDF GENERATOR
async function generatePdfFromHtml(html) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"] // ✅ IMPORTANT FOR RENDER
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm"
    }
  });

  await browser.close();
  return pdf;
}


// ✅ RESUME PDF
export async function generateResumePdf({ resume, selfDescription, jobDescription }) {

  const schema = z.object({
    html: z.string()
  });

  const prompt = `
Create a professional resume in HTML format.

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

Make it:
- ATS friendly
- Clean design
- 1 page preferred
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(schema),
    }
  });

  const parsed = JSON.parse(response.text);

  return await generatePdfFromHtml(parsed.html);
}