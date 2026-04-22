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

const tailoredResumeSchema = z.object({
  header: z.object({
    name: z.string(),
    title: z.string(),
    email: z.string().optional().default(""),
    phone: z.string().optional().default(""),
    location: z.string().optional().default(""),
    linkedin: z.string().optional().default(""),
    github: z.string().optional().default("")
  }),
  summary: z.string(),
  skills: z.array(
    z.object({
      label: z.string(),
      items: z.array(z.string())
    })
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      meta: z.string().optional().default(""),
      highlights: z.array(z.string())
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      meta: z.string().optional().default(""),
      highlights: z.array(z.string())
    })
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      meta: z.string().optional().default("")
    })
  )
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

function safeJsonParse(text, fallback = {}) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
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

function splitResumeSections(resume = "") {
  const normalized = String(resume || "")
    .replace(/\r/g, "")
    .replace(/\f/g, "\n")
    .replace(/[ \t]+\n/g, "\n");

  const sectionNames = [
    "PROFILE",
    "TECHNICAL SKILLS",
    "PROFESSIONAL EXPERIENCE",
    "PROJECTS",
    "EDUCATION"
  ];

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = {
    header: [],
    PROFILE: [],
    "TECHNICAL SKILLS": [],
    "PROFESSIONAL EXPERIENCE": [],
    PROJECTS: [],
    EDUCATION: []
  };

  let current = "header";
  for (const line of lines) {
    if (sectionNames.includes(line.toUpperCase())) {
      current = line.toUpperCase();
      continue;
    }
    sections[current].push(line);
  }

  return sections;
}

function parseHeader(lines = [], selfDescription = "", jobDescription = "") {
  const firstLine = lines[0] || "";
  const email = lines.find((line) => /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(line)) || "";
  const phone = lines.find((line) => /(?:\+?\d[\d\s-]{8,}\d)/.test(line)) || "";
  const linkedin = lines.find((line) => /linkedin\.com/i.test(line)) || "";
  const github = lines.find((line) => /github\.com/i.test(line)) || "";
  const location = lines.find((line) =>
    line &&
    line !== firstLine &&
    line !== email &&
    line !== phone &&
    line !== linkedin &&
    line !== github &&
    !/^https?:\/\//i.test(line)
  ) || "";

  let name = "Candidate";
  let title = jobDescription || "Full Stack Developer";

  if (firstLine) {
    const titleMatch = firstLine.match(/(.*?)(Full Stack.*|Frontend.*|Backend.*|Software.*|Developer.*|Engineer.*)$/i);
    if (titleMatch) {
      name = titleMatch[1].trim() || name;
      title = titleMatch[2].trim() || title;
    } else {
      const words = firstLine.split(/\s+/);
      name = words.slice(0, 2).join(" ") || name;
      title = words.slice(2).join(" ") || title;
    }
  } else if (selfDescription) {
    name = selfDescription.split("\n")[0].trim() || name;
  }

  return { name, title, email, phone, location, linkedin, github };
}

function parseSkillGroups(lines = []) {
  return lines
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return {
          label: "Core Skills",
          items: line.split(",").map((item) => item.trim()).filter(Boolean)
        };
      }

      return {
        label: line.slice(0, separatorIndex).trim(),
        items: line
          .slice(separatorIndex + 1)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      };
    })
    .filter((group) => group.items.length);
}

function parseExperienceEntries(lines = []) {
  const entries = [];
  let current = null;

  for (const line of lines.filter(Boolean)) {
    const isBullet = /^[•*-]/.test(line);
    const looksLikeMeta = /\b\d{2}\/\d{4}\b/.test(line) || /\bPresent\b/i.test(line);

    if (!current) {
      current = {
        company: line,
        role: "",
        meta: "",
        highlights: []
      };
      continue;
    }

    if (!current.role && !isBullet && !looksLikeMeta) {
      current.role = line;
      continue;
    }

    if (!current.meta && looksLikeMeta) {
      current.meta = line.replace(/\s+/g, " ").trim();
      continue;
    }

    if (!isBullet && current.role && current.highlights.length >= 2 && !looksLikeMeta) {
      entries.push(current);
      current = {
        company: line,
        role: "",
        meta: "",
        highlights: []
      };
      continue;
    }

    current.highlights.push(line.replace(/^[•*-]\s*/, ""));
  }

  if (current) {
    entries.push(current);
  }

  return entries.filter((entry) => entry.company);
}

function parseProjectEntries(lines = []) {
  const entries = [];
  let current = null;

  for (const line of lines.filter(Boolean)) {
    const isTechStack = /^tech stack:/i.test(line);
    const looksLikeMeta = /\b\d{2}\/\d{4}\b/.test(line);
    const isBullet = /^[•*-]/.test(line);

    if (!current) {
      current = {
        name: line,
        meta: "",
        highlights: []
      };
      continue;
    }

    if ((looksLikeMeta || isTechStack) && !current.meta) {
      current.meta = line;
      continue;
    }

    if (!isBullet && current.highlights.length >= 2 && !isTechStack && !looksLikeMeta) {
      entries.push(current);
      current = {
        name: line,
        meta: "",
        highlights: []
      };
      continue;
    }

    current.highlights.push(line.replace(/^[•*-]\s*/, ""));
  }

  if (current) {
    entries.push(current);
  }

  return entries.filter((entry) => entry.name);
}

function parseEducationEntries(lines = []) {
  if (!lines.length) {
    return [];
  }

  const first = lines[0] || "";
  const second = lines[1] || "";
  const meta = lines.slice(2).join(" | ");

  return [{
    institution: second || first,
    degree: second ? first : "",
    meta
  }];
}

function fallbackTailoredResume({ resume, selfDescription, jobDescription }) {
  const sections = splitResumeSections(resume);
  const header = parseHeader(sections.header, selfDescription, jobDescription);
  const summary = sections.PROFILE.length
    ? sections.PROFILE.join(" ")
    : (selfDescription || "Solution-driven developer with strong full-stack experience.");
  const skills = parseSkillGroups(sections["TECHNICAL SKILLS"]);
  const experience = parseExperienceEntries(sections["PROFESSIONAL EXPERIENCE"]);
  const projects = parseProjectEntries(sections.PROJECTS);
  const education = parseEducationEntries(sections.EDUCATION);

  return {
    header,
    summary,
    skills: skills.length ? skills : [{
      label: "Core Stack",
      items: ["React", "Node.js", "Express.js", "MongoDB", "JavaScript"]
    }],
    experience,
    projects,
    education
  };
}

async function generateTailoredResumeData({ resume, selfDescription, jobDescription }) {
  const fallback = fallbackTailoredResume({ resume, selfDescription, jobDescription });

  if (!resume && !selfDescription) {
    return fallback;
  }

  const prompt = `
You are an expert technical resume writer.

Create a tailored resume for the target role using ONLY facts present in the source resume/self-description.
Do not invent companies, dates, projects, degrees, tools, or achievements.
You may rewrite language, reorder content, tighten bullets, and prioritize the most relevant information for the job description.
Do not include sections like "Required Skills", "Good to Have", or raw job description text in the output.
Keep the resume concise, professional, ATS-friendly, and strong enough to apply for the job.
Return ONLY valid JSON.

Required JSON shape:
{
  "header": {
    "name": "string",
    "title": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string"
  },
  "summary": "string",
  "skills": [
    { "label": "string", "items": ["string"] }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "meta": "string",
      "highlights": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "meta": "string",
      "highlights": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "meta": "string"
    }
  ]
}

Target job description:
${jobDescription}

Source resume:
${resume}

Self description:
${selfDescription}
`;

  try {
    const response = await callGemini(() =>
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(tailoredResumeSchema)
        }
      })
    );

    const rawText =
      response.text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "{}";

    const parsed = tailoredResumeSchema.safeParse(safeJsonParse(rawText, {}));
    if (parsed.success) {
      return parsed.data;
    }

    return fallback;
  } catch (err) {
    console.log("TAILORED RESUME AI ERROR:", err);
    return fallback;
  }
}

function renderSkills(skills = []) {
  return skills
    .filter((group) => group?.label && Array.isArray(group.items) && group.items.length)
    .map((group) => `<p><strong>${escapeHtml(group.label)}:</strong> ${escapeHtml(group.items.join(", "))}</p>`)
    .join("");
}

function renderExperience(experience = []) {
  return experience
    .filter((entry) => entry?.company)
    .map((entry) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <div class="entry-title">${escapeHtml(entry.company)}</div>
            ${entry.role ? `<div class="entry-subtitle">${escapeHtml(entry.role)}</div>` : ""}
          </div>
          ${entry.meta ? `<div class="entry-meta">${escapeHtml(entry.meta)}</div>` : ""}
        </div>
        ${entry.highlights?.length ? `<ul class="entry-list">${entry.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      </div>
    `)
    .join("");
}

function renderProjects(projects = []) {
  return projects
    .filter((project) => project?.name)
    .map((project) => `
      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">${escapeHtml(project.name)}</div>
          ${project.meta ? `<div class="entry-meta">${escapeHtml(project.meta)}</div>` : ""}
        </div>
        ${project.highlights?.length ? `<ul class="entry-list">${project.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      </div>
    `)
    .join("");
}

function renderEducation(education = []) {
  return education
    .filter((entry) => entry?.institution || entry?.degree)
    .map((entry) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            ${entry.institution ? `<div class="entry-title">${escapeHtml(entry.institution)}</div>` : ""}
            ${entry.degree ? `<div class="entry-subtitle">${escapeHtml(entry.degree)}</div>` : ""}
          </div>
          ${entry.meta ? `<div class="entry-meta">${escapeHtml(entry.meta)}</div>` : ""}
        </div>
      </div>
    `)
    .join("");
}

function buildResumeHtml(data) {
  const header = data.header || {};
  const contactItems = [
    header.email,
    header.phone,
    header.location,
    header.linkedin,
    header.github
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Resume</title>
    <style>
      @page {
        size: A4;
        margin: 22mm 18mm;
      }
      body {
        font-family: Georgia, "Times New Roman", serif;
        color: #111111;
        line-height: 1.25;
        font-size: 12px;
        margin: 0;
      }
      .page {
        width: 100%;
      }
      .header {
        margin-bottom: 14px;
      }
      .name-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-bottom: 6px;
      }
      .name {
        font-size: 26px;
        font-weight: 700;
      }
      .title {
        font-size: 15px;
        font-style: italic;
      }
      .contacts {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 18px;
        font-size: 11px;
        margin-bottom: 8px;
      }
      .contact {
        white-space: nowrap;
      }
      .section {
        margin-top: 12px;
      }
      .section-title {
        font-size: 15px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.2px;
        border-bottom: 2px solid #222;
        padding-bottom: 2px;
        margin-bottom: 6px;
      }
      p {
        margin: 0 0 2px;
      }
      .summary {
        text-align: justify;
      }
      .entry {
        margin-bottom: 8px;
      }
      .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 2px;
      }
      .entry-title {
        font-weight: 700;
      }
      .entry-subtitle {
        font-weight: 700;
      }
      .entry-meta {
        white-space: nowrap;
        font-size: 11px;
      }
      .mono-block p {
        margin-bottom: 2px;
      }
      .entry-list {
        margin: 0;
        padding-left: 18px;
      }
      .entry-list li {
        margin-bottom: 2px;
      }
      a {
        color: inherit;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div class="name-row">
          <div class="name">${escapeHtml(header.name)}</div>
          <div class="title">${escapeHtml(header.title)}</div>
        </div>
        <div class="contacts">
          ${contactItems.map((item) => `<div class="contact">${escapeHtml(item)}</div>`).join("")}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Profile</div>
        <p class="summary">${escapeHtml(data.summary || "Strong full stack developer with relevant project experience.")}</p>
      </div>

      <div class="section">
        <div class="section-title">Technical Skills</div>
        <div class="mono-block">
          ${renderSkills(data.skills)}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Professional Experience</div>
        ${renderExperience(data.experience)}
      </div>

      <div class="section">
        <div class="section-title">Projects</div>
        ${renderProjects(data.projects)}
      </div>

      <div class="section">
        <div class="section-title">Education</div>
        ${renderEducation(data.education)}
      </div>
    </div>
  </body>
</html>`;
}

function buildResumeTextFromData(data) {
  const sections = [];
  const header = data.header || {};

  sections.push([header.name, header.title].filter(Boolean).join(" "));
  sections.push([header.email, header.phone, header.location, header.linkedin, header.github].filter(Boolean).join(" | "));
  sections.push("");
  sections.push("PROFILE");
  sections.push(data.summary || "");
  sections.push("");
  sections.push("TECHNICAL SKILLS");
  (data.skills || []).forEach((group) => {
    sections.push(`${group.label}: ${(group.items || []).join(", ")}`);
  });
  sections.push("");
  sections.push("PROFESSIONAL EXPERIENCE");
  (data.experience || []).forEach((entry) => {
    sections.push([entry.company, entry.role].filter(Boolean).join(" - "));
    if (entry.meta) {
      sections.push(entry.meta);
    }
    (entry.highlights || []).forEach((item) => sections.push(`- ${item}`));
  });
  sections.push("");
  sections.push("PROJECTS");
  (data.projects || []).forEach((project) => {
    sections.push(project.name);
    if (project.meta) {
      sections.push(project.meta);
    }
    (project.highlights || []).forEach((item) => sections.push(`- ${item}`));
  });
  sections.push("");
  sections.push("EDUCATION");
  (data.education || []).forEach((entry) => {
    sections.push([entry.institution, entry.degree].filter(Boolean).join(" - "));
    if (entry.meta) {
      sections.push(entry.meta);
    }
  });

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
  const tailoredResume = await generateTailoredResumeData({
    resume,
    selfDescription,
    jobDescription
  });
  const html = buildResumeHtml(tailoredResume);

  try {
    return await generatePdfFromHtml(html);
  } catch (err) {
    console.log("❌ Styled resume PDF failed, using plain PDF fallback:", err.message);
    return createSimplePdf(
      buildResumeTextFromData(tailoredResume)
    );
  }
}
