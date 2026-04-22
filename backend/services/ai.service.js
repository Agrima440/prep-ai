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
    const response = await callGemini(() =>
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
          // ❌ IMPORTANT: NO responseSchema
        }
      })
    );

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

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapePdfText(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");
}

function wrapText(text, maxChars = 88) {
  const input = String(text || "").replace(/\s+/g, " ").trim();
  if (!input) return [""];

  const words = input.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (word.length <= maxChars) {
      current = word;
      continue;
    }

    let remaining = word;
    while (remaining.length > maxChars) {
      lines.push(remaining.slice(0, maxChars));
      remaining = remaining.slice(maxChars);
    }
    current = remaining;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function buildResumeHtml({ resume, selfDescription, jobDescription }) {
  const summary = selfDescription || resume || "Candidate profile not provided.";
  const job = jobDescription || "MERN Developer";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Resume</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 36px;
        color: #1f2937;
        line-height: 1.5;
      }
      h1, h2, h3 {
        margin: 0 0 12px;
      }
      h1 {
        font-size: 28px;
      }
      h2 {
        font-size: 18px;
        color: #db2777;
      }
      h3 {
        margin-top: 24px;
        font-size: 16px;
      }
      .section {
        margin-top: 18px;
      }
      .card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
      }
      p {
        margin: 0;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(selfDescription?.split("\n")[0] || "Candidate")}</h1>
    <h2>${escapeHtml(job)}</h2>

    <div class="section card">
      <h3>Professional Summary</h3>
      <p>${escapeHtml(summary)}</p>
    </div>

    <div class="section card">
      <h3>Resume Content</h3>
      <p>${escapeHtml(resume || "Resume text was not available, so this PDF was generated from the saved profile details.")}</p>
    </div>
  </body>
</html>`;
}

function buildResumeText({ resume, selfDescription, jobDescription }) {
  const sections = [
    "RESUME",
    "",
    `Target Role: ${jobDescription || "MERN Developer"}`,
    "",
    "Professional Summary",
    selfDescription || "Candidate profile not provided.",
    "",
    "Resume Content",
    resume || "Resume text was not available, so this PDF was generated from the saved profile details."
  ];

  return sections.join("\n");
}

function createSimplePdf(text) {
  const lines = String(text)
    .split("\n")
    .flatMap((line) => wrapText(line, 88));

  const linesPerPage = 45;
  const pages = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  if (pages.length === 0) {
    pages.push(["Resume unavailable"]);
  }

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const catalogId = addObject("");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];

  for (const pageLines of pages) {
    const streamLines = [
      "BT",
      "/F1 12 Tf",
      "50 792 Td",
      "14 TL"
    ];

    pageLines.forEach((line, index) => {
      const escaped = escapePdfText(line);
      streamLines.push(`${index === 0 ? "" : "T* " }(${escaped}) Tj`.trim());
    });
    streamLines.push("ET");

    const stream = streamLines.join("\n");
    const contentId = addObject(
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`
    );
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  }

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((content, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${content}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

// ================= PDF =================
async function generatePdfFromHtml(html) {
  let browser;

  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    return await page.pdf({ format: "A4" });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
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

    const fallbackHtml = buildResumeHtml({
      resume,
      selfDescription,
      jobDescription
    });

    try {
      return await generatePdfFromHtml(fallbackHtml);
    } catch (pdfErr) {
      console.log("❌ HTML to PDF failed, using plain PDF fallback:", pdfErr.message);
      return createSimplePdf(
        buildResumeText({ resume, selfDescription, jobDescription })
      );
    }
  }
}
