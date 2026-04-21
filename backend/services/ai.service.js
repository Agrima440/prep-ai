import { GoogleGenAI } from "@google/genai";
import puppeteer from "puppeteer";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// ================= RETRY =================
async function callGemini(fn, retries = 3) {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0 && err.status === 503) {
      await new Promise(res => setTimeout(res, 2000));
      return callGemini(fn, retries - 1);
    }
    throw err;
  }
}

// ================= EXTRACT JSON (CRITICAL FIX) =================
function extractJSON(text) {
  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) return null;

    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// ================= NORMALIZER =================
function normalizeData(parsed) {
  return {
    matchScore:
      typeof parsed?.matchScore === "number" ? parsed.matchScore : 60,

    title: parsed?.title || "Software Engineer",

    technicalQuestions: (parsed?.technicalQuestions || []).map(q => ({
      question: q?.question || "No question provided",
      intention: q?.intention || "General understanding",
      answer: q?.answer || "No answer provided"
    })),

    behavioralQuestions: (parsed?.behavioralQuestions || []).map(q => ({
      question: q?.question || "No question provided",
      intention: q?.intention || "Behavior check",
      answer: q?.answer || "No answer provided"
    })),

    skillGaps: (parsed?.skillGaps || []).map(s => ({
      skill: s?.skill || "Unknown Skill",
      severity: ["low", "medium", "high"].includes(s?.severity)
        ? s.severity
        : "medium"
    })),

    preparationPlan: (parsed?.preparationPlan || []).map(d => ({
      day: d?.day || 1,
      focus: d?.focus || "General Practice",
      tasks: Array.isArray(d?.tasks) ? d.tasks : ["Practice"]
    }))
  };
}

// ================= MAIN FUNCTION =================
export async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription
}) {
  const prompt = `
You are an expert interviewer.

Generate a COMPLETE interview report in JSON.

STRICT FORMAT:
{
  "matchScore": number (0-100),
  "title": string,
  "technicalQuestions": [
    { "question": string, "intention": string, "answer": string }
  ],
  "behavioralQuestions": [
    { "question": string, "intention": string, "answer": string }
  ],
  "skillGaps": [
    { "skill": string, "severity": "low" | "medium" | "high" }
  ],
  "preparationPlan": [
    { "day": number, "focus": string, "tasks": [string] }
  ]
}

RULES:
- Minimum 3 technical questions
- Minimum 2 behavioral questions
- Minimum 3 skill gaps
- Minimum 7 days plan
- RETURN ONLY JSON

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`;

  try {
    const response = await callGemini(() =>
      ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json" // ✅ VERY IMPORTANT
        }
      })
    );

    const rawText =
      response.text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    console.log("🔥 RAW AI RESPONSE:", rawText);

    const parsed = extractJSON(rawText);

    console.log("✅ PARSED:", parsed);

    if (!parsed) {
      console.log("❌ JSON extraction failed → fallback");
      return getFallback();
    }

    return normalizeData(parsed);

  } catch (err) {
    console.error("❌ Gemini failed:", err.message);
    return getFallback();
  }
}

// ================= FALLBACK =================
function getFallback() {
  return {
    matchScore: 60,
    title: "Software Engineer",
    technicalQuestions: [
      {
        question: "Explain closures in JavaScript",
        intention: "Check JS fundamentals",
        answer: "Closures allow access to outer scope variables"
      }
    ],
    behavioralQuestions: [
      {
        question: "Tell me about yourself",
        intention: "Communication",
        answer: "Explain your experience briefly"
      }
    ],
    skillGaps: [{ skill: "System Design", severity: "medium" }],
    preparationPlan: [
      {
        day: 1,
        focus: "JavaScript",
        tasks: ["Closures", "Promises"]
      }
    ]
  };
}

// ================= PDF =================
async function generatePdfFromHtml(html) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setContent(html);

  const pdf = await page.pdf({ format: "A4" });

  await browser.close();
  return pdf;
}

export async function generateResumePdf({
  resume,
  selfDescription,
  jobDescription
}) {
  try {
    const response = await callGemini(() =>
      ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Create a professional resume in HTML format only`
      })
    );

    const html =
      response.text ||
      "<h1>Resume generation failed</h1>";

    return await generatePdfFromHtml(html);

  } catch {
    return await generatePdfFromHtml("<h1>Resume generation failed</h1>");
  }
}