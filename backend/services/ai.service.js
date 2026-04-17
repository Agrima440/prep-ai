import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import puppeteer from "puppeteer";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// ✅ SCHEMA
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


// ✅ RETRY (fix 503 error)
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


// ✅ FIX STRING → OBJECT
function fixArray(arr) {
  if (!Array.isArray(arr)) return [];

  return arr.map((item) => {
    if (typeof item === "string") {
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    }
    return item;
  }).filter(Boolean);
}


// ✅ ENSURE MIN DATA
const ensureMin = (arr, min, fallback) => {
  while (arr.length < min) arr.push(fallback);
  return arr;
};


// ✅ MAIN FUNCTION
export async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

  const prompt = `
You are an expert interviewer.

Generate a COMPLETE interview report.

STRICT RULES:
- matchScore must be between 0-100
- title must be short
- MUST return valid JSON
- DO NOT return empty arrays
- DO NOT return strings instead of objects

MINIMUM:
- At least 3 technicalQuestions
- At least 2 behavioralQuestions
- At least 3 skillGaps
- At least 7 preparationPlan days

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`;

  let response;

  try {
    response = await callGemini(() =>
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(interviewReportSchema),
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

    return {
      matchScore: parsed.matchScore ?? 60,
      title: parsed.title || "Software Engineer",

     technicalQuestions: fixArray(parsed.technicalQuestions).length >= 3
  ? fixArray(parsed.technicalQuestions)
  : [
      {
        question: "Explain closures in JavaScript",
        intention: "Check JS fundamentals",
        answer: "Closures allow access to outer scope variables"
      },
      {
        question: "What is event loop?",
        intention: "Async understanding",
        answer: "Handles async operations in JS"
      },
      {
        question: "Difference between var, let, const?",
        intention: "JS basics",
        answer: "Scope and hoisting differences"
      }
    ],

     behavioralQuestions: fixArray(parsed.behavioralQuestions).length >= 2
  ? fixArray(parsed.behavioralQuestions)
  : [
      {
        question: "Tell me about yourself",
        intention: "Communication",
        answer: "Explain your experience"
      },
      {
        question: "Describe a challenge you faced",
        intention: "Problem solving",
        answer: "Explain situation and solution"
      }
    ],

      skillGaps: ensureMin(
        fixArray(parsed.skillGaps),
        3,
        { skill: "System Design", severity: "medium" }
      ),

     preparationPlan: fixArray(parsed.preparationPlan).length >= 7
  ? fixArray(parsed.preparationPlan)
  : [
      { day: 1, focus: "JavaScript", tasks: ["Closures", "Promises"] },
      { day: 2, focus: "React", tasks: ["Hooks", "State"] },
      { day: 3, focus: "Node.js", tasks: ["API", "Middleware"] },
      { day: 4, focus: "MongoDB", tasks: ["Aggregation", "Indexing"] },
      { day: 5, focus: "System Design", tasks: ["Basics", "Scaling"] },
      { day: 6, focus: "DevOps", tasks: ["Docker", "CI/CD"] },
      { day: 7, focus: "Revision", tasks: ["Mock Interview"] }
    ],
    };

  } catch (err) {
    console.error("Parse error:", err);
    return getFallback();
  }
}


// ✅ FALLBACK
function getFallback() {
  return {
    matchScore: 60,
    title: "Software Engineer",
    technicalQuestions: [
      {
        question: "Explain closures in JavaScript",
        intention: "Check fundamentals",
        answer: "Closures allow access to outer scope"
      }
    ],
    behavioralQuestions: [
      {
        question: "Tell me about yourself",
        intention: "Communication",
        answer: "Explain your experience"
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
}


// ✅ PDF
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

export async function generateResumePdf({ resume, selfDescription, jobDescription }) {

  const schema = z.object({ html: z.string() });

  try {
    const response = await callGemini(() =>
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create resume HTML`,
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(schema),
        }
      })
    );

    const parsed = JSON.parse(response.text);
    return await generatePdfFromHtml(parsed.html);

  } catch {
    return await generatePdfFromHtml("<h1>Failed</h1>");
  }
}