import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

dotenv.config();

const prisma = new PrismaClient();

// Setup the Gemini model
const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-2.0-flash"
});

// 🧱 Define a Zod schema for validation
const ComplaintSchema = z.object({
  summary: z
    .string()
    .describe("Brief summary (≤20 words) of what happened between 2 parties or whats happenning there"),
  charactersParty1: z
    .array()
    .describe("characters that stay in party1 after the scenario"),
    charactersParty2:z
    .array()
    .describe("character that stay in party2 after the scenario")
});

// Create the LangChain parser based on the Zod schema
const parser = StructuredOutputParser.fromZodSchema(ComplaintSchema);

// 🧠 Define prompt
const prompt = new PromptTemplate({
  template: `You are analysing interactions or incidents between two parties in Indian Railways.

Party 1: {party1}
Party 2: {party2}

Your tasks:
1. Summarise what happened briefly (≤20 words).
2. Describe key characters or parties involved.
3. Classify into one of: operations, maintenance, safety, customer service, logistics.
4. Suggest the department responsible (Operations, Maintenance, Safety, Customer Service, Logistics).
5. Give a numeric urgency score (0–100).
6. Map that score into one of: low, medium, high.

Return the result in JSON format as per these instructions:

{format_instructions}`,
  inputVariables: ["party1", "party2"],
  partialVariables: { format_instructions: parser.getFormatInstructions() }
});

/**
 * Analyses a scenario between two parties and returns structured details.
 * @param {string} party1 - Description of the first party (e.g. passenger, staff, etc.)
 * @param {string} party2 - Description of the second party (e.g. station master, ticket counter, etc.)
 * @returns {Promise<object>} Structured output with departmentId.
 */
export default async function GiveScenario(party1, party2,party1Characters,party2Characters) {
  // 1️⃣ Prepare the prompt
  const input = await prompt.format({ party1, party2,party1Characters,party2Characters });

  // 2️⃣ Get model output
  const response = await llm.invoke(input);

  // 3️⃣ Parse + validate response against Zod schema
  let parsed;
  try {
    parsed = await parser.parse(response.content);
  } catch (err) {
    console.error("❌ Parsing or validation failed:", err);
    throw new Error("Model output invalid or malformed JSON.");
  }

  // 4️⃣ Fetch department ID safely
  const deptRecord = await prisma.department.findUnique({
    where: { name: parsed.department }
  });

  if (!deptRecord) {
    throw new Error(`Department "${parsed.department}" not found in database.`);
  }

  // 5️⃣ Return structured result with DB mapping
  return {
    ...parsed,
    departmentId: deptRecord.id
  };
}

