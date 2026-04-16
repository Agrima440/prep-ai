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

  const fallbackData = {
  matchScore: 60,
  title: "Software Engineer",
  technicalQuestions: [
    {
      question: "Explain closures in JavaScript",
      intention: "Check JS fundamentals",
      answer: "Closures allow functions to access outer scope variables"
    }
  ],
  behavioralQuestions: [
    {
      question: "Tell me about yourself",
      intention: "Communication",
      answer: "Briefly explain your experience and skills"
    }
  ],
  skillGaps: [
    { skill: "System Design", severity: "medium" }
  ],
  preparationPlan: [
    {
      day: 1,
      focus: "JavaScript",
      tasks: ["Closures", "Promises"]
    }
  ]
};
const prompt = `
You are an expert interviewer.

Generate a COMPLETE interview report in JSON.

STRICT RULES:
- matchScore must be between 0-100
- title must be short (e.g., "Full Stack Developer")
- MUST return at least:
  - 3 technicalQuestions
  - 2 behavioralQuestions
  - 3 skillGaps
  - 5 preparationPlan days

FORMAT EXACTLY:

{
  "matchScore": number,
  "title": string,
  "technicalQuestions": [
    {
      "question": "...",
      "intention": "...",
      "answer": "..."
    }
  ],
  "behavioralQuestions": [...],
  "skillGaps": [...],
  "preparationPlan": [...]
}

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`;
  let response;

  try {
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(interviewReportSchema),
      }
    });
  } catch (err) {
console.error("Gemini Error:", err);
    return {
      matchScore: 60,
      title: "Software Engineer",
      technicalQuestions: [],
      behavioralQuestions: [],
      skillGaps: [],
      preparationPlan: []
    };
  }

  try {
    const rawText =
      response.text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "{}";

    const parsed = JSON.parse(rawText);

    return {
      matchScore: parsed.matchScore ?? 60,
      title: parsed.title || "Software Engineer",
      technicalQuestions: parsed.technicalQuestions || [],
      behavioralQuestions: parsed.behavioralQuestions || [],
      skillGaps: parsed.skillGaps || [],
      preparationPlan: parsed.preparationPlan || []
    };

  } catch {
    return {
      matchScore: 60,
      title: "Software Engineer",
      technicalQuestions: [],
      behavioralQuestions: [],
      skillGaps: [],
      preparationPlan: []
    };
  }
}


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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(schema), // ✅ FIXED
      }
    });

    const rawText =
      response.text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "{}";

    const parsed = JSON.parse(rawText);

    return await generatePdfFromHtml(parsed.html);

  } catch (err) {
    console.log("PDF AI FAILED");

return await generatePdfFromHtml(`
  <div style="font-family:sans-serif; text-align:center; padding:40px">
    <h1>Resume Generation Failed</h1>
    <p>Please try again later.</p>
  </div>
`);  }
}