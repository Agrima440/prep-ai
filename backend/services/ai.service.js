import { GoogleGenAI } from "@google/genai";  
import {z} from "zod";
import {zodToJsonSchema} from "zod-to-json-schema";

export const googleGenAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

export async function invokeGeminiAi() {
  try {
    const response = await googleGenAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello Gemini! Explain what is an interview?"
    });

    console.log(response.text);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

const ai= new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});


const interviewReportSchema = z.object({

  matchScore: z.number().min(0).max(100).describe(
    "A score between 0 and 100 indicating how well the candidate matches the job description"
  ),

  technicalQuestions: z.array(
    z.object({
      question: z.string().describe("Technical question"),
      intention: z.string().describe("Why interviewer asks this"),
      answer: z.string().describe("How to answer properly")
    })
  ).describe("Technical interview questions"),

  behavioralQuestions: z.array(
    z.object({
      question: z.string().describe("Behavioral question"),
      intention: z.string().describe("Why interviewer asks this"),
      answer: z.string().describe("How to answer properly")
    })
  ).describe("Behavioral interview questions"),

  skillGaps: z.array(
    z.object({
      skill: z.string().describe("Missing skill"),
      severity: z.enum(["low", "medium", "high"]).describe("Gap severity")
    })
  ).describe("Skill gaps in candidate profile"),

  preparationPlan: z.array(
    z.object({
      day: z.number().describe("Day number"),
      focus: z.string().describe("Focus of the day"),
      tasks: z.array(z.string()).describe("Tasks for the day")
    })
  ).describe("Day-wise preparation plan")

});

export async function generateInterviewReport(resume, selfDescription, jobDescription) {

  try {

    const prompt = `
Generate an interview report for a candidate.

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`;

    const fullSchema = zodToJsonSchema(interviewReportSchema, "InterviewReport");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",

        // ✅ FIXED
        responseSchema: fullSchema.definitions.InterviewReport
      }
    });

    // const result = JSON.parse(response.text);

    // console.log("Generated Report:", result);

    return JSON.parse(response.text);

  } catch (error) {
    console.error("Error generating report:", error.message);
  }
}
