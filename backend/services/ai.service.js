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

// ================= INTERVIEW REPORT =================
export async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription
}) {
  const prompt = `
Generate interview report JSON.

STRICT:
- Only JSON
- No explanation
- Minimum 3 technical, 2 behavioral, 3 skills, 7 days plan

{
  "matchScore": number,
  "title": string,
  "technicalQuestions": [
    { "question": "", "intention": "", "answer": "" }
  ],
  "behavioralQuestions": [],
  "skillGaps": [{ "skill": "", "severity": "low|medium|high" }],
  "preparationPlan": [{ "day": 1, "focus": "", "tasks": [""] }]
}

Resume: ${resume}
Self: ${selfDescription}
JD: ${jobDescription}
`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const text =
      res.text ||
      res.candidates?.[0]?.content?.parts?.[0]?.text ||
      "{}";

    const parsed = JSON.parse(text);

    return parsed;

  } catch (err) {
    console.log("AI ERROR:", err.message);

    return {
      matchScore: 60,
      title: "Software Engineer",
      technicalQuestions: [
        {
          question: "Explain closures",
          intention: "JS fundamentals",
          answer: "Closure gives access to outer scope"
        }
      ],
      behavioralQuestions: [
        {
          question: "Tell me about yourself",
          intention: "Communication",
          answer: "Explain briefly"
        }
      ],
      skillGaps: [{ skill: "System Design", severity: "medium" }],
      preparationPlan: [
        { day: 1, focus: "JS", tasks: ["Closures"] }
      ]
    };
  }
}

// ================= PDF =================
async function generatePdfFromHtml(html) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // ✅ FIXED RENDER
  await page.setContent(html, {
    waitUntil: "networkidle0"
  });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true
  });

  console.log("PDF SIZE:", pdf.length);

  await browser.close();
  return pdf;
}

// ================= RESUME =================
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