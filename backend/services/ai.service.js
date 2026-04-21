import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import puppeteer from "puppeteer";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// ================= SCHEMA =================
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

// ================= FIX ARRAY =================
function fixArray(arr) {
  if (!Array.isArray(arr)) return [];

  return arr
    .map((item) => {
      if (typeof item === "string") {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      }
      return item;
    })
    .filter(Boolean);
}

// ================= MAIN FUNCTION =================
export async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription
}) {
  const prompt = `
You are an expert interviewer.

Generate a COMPLETE interview report.

STRICT RULES:
- matchScore must be between 0-100
- title must be short
- DO NOT return empty arrays
- DO NOT return strings instead of objects
- ALL items must be UNIQUE (no repetition)

MINIMUM:
- At least 3 technicalQuestions
- At least 2 behavioralQuestions
- At least 3 skillGaps
- At least 7 preparationPlan days

Return ONLY valid JSON.

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`;

  let response;

  try {
    response = await callGemini(() =>
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(interviewReportSchema)
        }
      })
    );
  } catch (err) {
    console.error("Gemini failed:", err);
    return getFallback();
  }

  try {
    const rawText =
      response.text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "{}";

    const parsed = JSON.parse(rawText);

    // ===== VALIDATION =====

    const validTech = fixArray(parsed.technicalQuestions).filter(
      (q) => q?.question && q?.intention && q?.answer
    );

    const validBehavioral = fixArray(parsed.behavioralQuestions).filter(
      (q) => q?.question && q?.intention && q?.answer
    );

    const validSkills = fixArray(parsed.skillGaps).filter(
      (s) => s?.skill && ["low", "medium", "high"].includes(s?.severity)
    );

    const validPlan = fixArray(parsed.preparationPlan).filter(
      (d) => d?.day && d?.focus && Array.isArray(d?.tasks)
    );

    return {
      matchScore:
        typeof parsed.matchScore === "number"
          ? parsed.matchScore
          : 60,

      title: parsed.title || "Software Engineer",

      technicalQuestions:
        validTech.length >= 3 ? validTech : fallbackTech(),

      behavioralQuestions:
        validBehavioral.length >= 2
          ? validBehavioral
          : fallbackBehavioral(),

      skillGaps:
        validSkills.length >= 3 ? validSkills : fallbackSkills(),

      preparationPlan:
        validPlan.length >= 7 ? validPlan : fallbackPlan()
    };
  } catch (err) {
    console.error("Parse error:", err);
    return getFallback();
  }
}

// ================= FALLBACKS =================

function fallbackTech() {
  return [
    {
      question: "Explain closures in JavaScript",
      intention: "Check JS fundamentals",
      answer: "Closures allow access to outer scope variables"
    },
    {
      question: "What is event loop?",
      intention: "Async understanding",
      answer: "Handles async operations in JavaScript"
    },
    {
      question: "Difference between var, let, const?",
      intention: "JS basics",
      answer: "Scope and hoisting differences"
    }
  ];
}

function fallbackBehavioral() {
  return [
    {
      question: "Tell me about yourself",
      intention: "Communication",
      answer: "Explain your experience briefly"
    },
    {
      question: "Describe a challenge you faced",
      intention: "Problem solving",
      answer: "Explain situation and how you solved it"
    }
  ];
}

function fallbackSkills() {
  return [
    { skill: "System Design", severity: "medium" },
    { skill: "CI/CD", severity: "medium" },
    { skill: "Docker", severity: "low" }
  ];
}

function fallbackPlan() {
  return [
    { day: 1, focus: "JavaScript", tasks: ["Closures", "Promises"] },
    { day: 2, focus: "React", tasks: ["Hooks", "State"] },
    { day: 3, focus: "Node.js", tasks: ["API", "Middleware"] },
    { day: 4, focus: "MongoDB", tasks: ["Aggregation", "Indexing"] },
    { day: 5, focus: "System Design", tasks: ["Basics", "Scaling"] },
    { day: 6, focus: "DevOps", tasks: ["Docker", "CI/CD"] },
    { day: 7, focus: "Revision", tasks: ["Mock Interview"] }
  ];
}

function getFallback() {
  return {
    matchScore: 60,
    title: "Software Engineer",
    technicalQuestions: fallbackTech(),
    behavioralQuestions: fallbackBehavioral(),
    skillGaps: fallbackSkills(),
    preparationPlan: fallbackPlan()
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
  const schema = z.object({ html: z.string() });

  try {
    const response = await callGemini(() =>
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Create a professional resume in HTML`,
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(schema)
        }
      })
    );

    const parsed = JSON.parse(response.text);
    return await generatePdfFromHtml(parsed.html);
  } catch {
    return await generatePdfFromHtml("<h1>Resume generation failed</h1>");
  }
}