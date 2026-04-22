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

RULES:
- matchScore must be between 0-100
- title must be short
- ALL items must be UNIQUE
- DO NOT return empty arrays
- Return ONLY valid JSON

MINIMUM:
- At least 3 technicalQuestions
- At least 2 behavioralQuestions
- At least 3 skillGaps
- At least 7 preparationPlan days

FORMAT:

{
  "matchScore": number,
  "title": string,
  "technicalQuestions": [
    { "question": "...", "intention": "...", "answer": "..." }
  ],
  "behavioralQuestions": [...],
  "skillGaps": [
    { "skill": "...", "severity": "low|medium|high" }
  ],
  "preparationPlan": [
    { "day": number, "focus": "...", "tasks": ["..."] }
  ]
}

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
        // ❌ IMPORTANT: NO responseSchema
      }
    });

    const rawText =
      response.text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "{}";

    console.log("AI RAW:", rawText); // 🔥 debug

    const parsed = JSON.parse(rawText);

    return {
      matchScore: parsed.matchScore || 60,
      title: parsed.title || "Software Engineer",
      technicalQuestions: parsed.technicalQuestions || [],
      behavioralQuestions: parsed.behavioralQuestions || [],
      skillGaps: parsed.skillGaps || [],
      preparationPlan: parsed.preparationPlan || []
    };

  } catch (err) {
    console.log("AI ERROR:", err);

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
await page.setContent(html, {
  waitUntil: "networkidle0"
});
  const pdf = await page.pdf({ format: "A4" });

  await browser.close();
  return pdf;
}

export async function generateResumePdf({
  resume,
  selfDescription,
  jobDescription
}) {
  const prompt = `
Generate professional resume HTML.

STRICT:
- Only HTML
- No markdown
- Must start with <!DOCTYPE html>
- Inline CSS
- Clean layout

Resume: ${resume}
Self: ${selfDescription}
JD: ${jobDescription}
`;

  try {
    const res = await callGemini(() =>
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      })
    );

    let html =
      res.text ||
      res.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    // CLEAN
    html = html.replace(/```html/g, "").replace(/```/g, "").trim();

    // SAFETY WRAP
    if (!html.includes("<html")) {
      html = `
        <!DOCTYPE html>
        <html>
          <body>${html}</body>
        </html>
      `;
    }

    if (!html || html.length < 100) {
      throw new Error("Invalid HTML");
    }

    return await generatePdfFromHtml(html);

  } catch (err) {
    console.log("❌ Resume failed:", err.message);

    // ✅ ALWAYS WORKING FALLBACK
    return await generatePdfFromHtml(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h1>${selfDescription || "Candidate"}</h1>
          <h2>MERN Developer</h2>
          <p>${selfDescription || "Developer profile"}</p>

          <h3>Skills</h3>
          <ul>
            <li>JavaScript</li>
            <li>React</li>
            <li>Node.js</li>
            <li>MongoDB</li>
          </ul>
        </body>
      </html>
    `);
  }
}