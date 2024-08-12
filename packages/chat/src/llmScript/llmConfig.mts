#!/usr/bin/env node
import dotenv from "dotenv";
import OpenAI from "openai";

// Configuration
dotenv.config({ path: ".env.local" });
const MAX_ATTEMPTS = 10;
const SQUIGGLE_DOCS_PATH = "./src/prompt.md";
// const OPENROUTER_MODEL = "openai/gpt-4o-202408-06";
const OPENROUTER_MODEL = "openai/gpt-4o-mini";

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function runLLM(content: string) {
  return openai.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [{ role: "user", content }],
  });
}
