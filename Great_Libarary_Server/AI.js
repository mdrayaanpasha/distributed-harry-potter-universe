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
  characters: z
    .array(z.string())
    .describe("characters that decided to go to the venue")
});

// Create the LangChain parser based on the Zod schema
const parser = StructuredOutputParser.fromZodSchema(ComplaintSchema);

// 🧠 Define prompt
const prompt = new PromptTemplate({
  template: `
  so imagine you are in the universe of harry potter
   a scene inside the great library where the following characters are present : {characters},

   your task is to:
   1. give me an output in json format.
   2. where json includes, summary of what happens inside great library with my characters.
   3. and then a list of character who decided to go to other venue that is {effectOn}

make sure it looks realistic.

{format_instructions}`,
  inputVariables: ["characters","effectOn"],
  partialVariables: { format_instructions: parser.getFormatInstructions() }
});


export default async function AIService(characters,effectOn) {
  // 1️⃣ Prepare the prompt
  const input = await prompt.format({ characters,effectOn});

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

  return {
    chars:parsed.characters,
    summ:parsed.summary
  }
  
}
