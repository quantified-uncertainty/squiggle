#!/usr/bin/env node
import dotenv from "dotenv";
import OpenAI from "openai";

// Configuration
dotenv.config({ path: ".env.local" });

const OPENROUTER_MODEL = "openai/gpt-4o-mini";

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

let conversationHistory: Message[] = [];

export async function runLLM(
  content: string,
  role: "system" | "user" = "user"
) {
  conversationHistory.push({ role, content });

  try {
    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: conversationHistory,
    });

    if (
      completion.choices &&
      completion.choices.length > 0 &&
      completion.choices[0].message
    ) {
      conversationHistory.push({
        role: "assistant",
        content: completion.choices[0].message.content || "",
      });
    } else {
      console.warn(
        "Unexpected API response structure:",
        JSON.stringify(completion, null, 2)
      );
    }

    return completion;
  } catch (error) {
    console.error("Error in API call:", error);
    throw error;
  }
}

export function resetConversation() {
  conversationHistory = [];
}

export function getConversationHistory() {
  return conversationHistory;
}
