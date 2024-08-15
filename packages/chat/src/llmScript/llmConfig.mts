#!/usr/bin/env node
import dotenv from "dotenv";
import OpenAI from "openai";

// Configuration
dotenv.config({ path: ".env.local" });

export const SELECTED_MODEL = "GPT-4o-mini";

// Model selection and pricing
type ModelConfig = {
  model: string;
  inputRate: number;
  outputRate: number;
  contextWindow: number;
};

const MODEL_CONFIGS: { [key: string]: ModelConfig } = {
  "GPT-4o": {
    model: "openai/gpt-4o-2024-08-06",
    inputRate: 0.0000025, // $2.5 per million input tokens
    outputRate: 0.00001, // $10 per million output tokens
    contextWindow: 128000, // Assuming 128K context window
  },
  "GPT-4o-mini": {
    // seems like a good trade-off, for development
    model: "openai/gpt-4o-mini-2024-07-18",
    inputRate: 0.00000015, // $0.15 per million input tokens
    outputRate: 0.0000006, // $0.6 per million output tokens
    contextWindow: 128000, // Assuming 128K context window
  },
  "Claude-3.5-Sonnet": {
    // maybe the best, but seems expensive and slow
    model: "anthropic/claude-3.5-sonnet",
    inputRate: 0.000003, // $3 per million input tokens
    outputRate: 0.000015, // $15 per million output tokens
    contextWindow: 200000, // 200K context window
  },
  "DeepSeek-Coder-V2": {
    // Decent and cheap, but very slow
    model: "deepseek/deepseek-coder",
    inputRate: 0.00000014, // $0.14 per million input tokens
    outputRate: 0.00000028, // $0.28 per million output tokens
    contextWindow: 128000, // 128K context window
  },
  "Llama-3.1": {
    // seems pretty mediocre, weird results much of the time.
    model: "meta-llama/llama-3.1-405b-instruct",
    inputRate: 0.0000027, // $2.7 per million input tokens
    outputRate: 0.0000027, // $2.7 per million output tokens
    contextWindow: 131072, // 131,072 context window
  },
};

// Select the model you want to use
const OPENROUTER_MODEL = MODEL_CONFIGS[SELECTED_MODEL].model;

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

export function calculatePrice(
  inputTokens: number,
  outputTokens: number
): number {
  const { inputRate, outputRate } = MODEL_CONFIGS[SELECTED_MODEL];
  const inputCost = inputTokens * inputRate;
  const outputCost = outputTokens * outputRate;
  return inputCost + outputCost;
}
