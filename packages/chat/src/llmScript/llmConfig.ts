#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import OpenAI from "openai";

import { squiggleDocs } from "./helpers";

// Configuration
dotenv.config({ path: ".env.local" });

export const SELECTED_MODEL = "Claude-3.5-Sonnet";
// export const SELECTED_MODEL = "Claude-3-Haiku";
// export const SELECTED_MODEL = "GPT-4o-mini";
// export const SELECTED_MODEL = "GPT-4o";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model selection and pricing
type ModelConfig = {
  provider: "anthropic" | "openrouter";
  model: string;
  inputRate: number;
  outputRate: number;
  contextWindow: number;
};

const MODEL_CONFIGS: { [key: string]: ModelConfig } = {
  "GPT-4o": {
    provider: "openrouter",
    model: "openai/gpt-4o-2024-08-06",
    inputRate: 0.0000025,
    outputRate: 0.00001,
    contextWindow: 128000,
  },
  "GPT-4o-mini": {
    provider: "openrouter",
    model: "openai/gpt-4o-mini-2024-07-18",
    inputRate: 0.00000015,
    outputRate: 0.0000006,
    contextWindow: 128000,
  },
  "Claude-3.5-Sonnet": {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20240620",
    inputRate: 0.000003,
    outputRate: 0.000015,
    contextWindow: 200000,
  },
  "Claude-3-Haiku": {
    provider: "anthropic",
    model: "claude-3-haiku-20240307",
    inputRate: 0.00000025,
    outputRate: 0.00000125,
    contextWindow: 200000,
  },
  "DeepSeek-Coder-V2": {
    provider: "openrouter",
    model: "deepseek/deepseek-coder",
    inputRate: 0.00000014,
    outputRate: 0.00000028,
    contextWindow: 128000,
  },
  "Llama-3.1": {
    provider: "openrouter",
    model: "meta-llama/llama-3.1-405b-instruct",
    inputRate: 0.0000027,
    outputRate: 0.0000027,
    contextWindow: 131072,
  },
};

const SELECTED_MODEL_CONFIG = MODEL_CONFIGS[SELECTED_MODEL];

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

function convertToClaudeMessages(history: Message[]): Anthropic.MessageParam[] {
  return history
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
}

function extractTextContent(content: Anthropic.ContentBlock[]): string {
  return content
    .filter(
      (block): block is Extract<Anthropic.ContentBlock, { type: "text" }> =>
        block.type === "text"
    )
    .map((block) => block.text)
    .join("\n");
}

interface StandardizedChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  content: string;
  role: "assistant";
  finish_reason: string | null;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function convertClaudeToStandardFormat(
  claudeResponse: Anthropic.Message
): StandardizedChatCompletion {
  return {
    id: claudeResponse.id,
    object: "chat.completion",
    created: Date.now(),
    model: claudeResponse.model,
    content: extractTextContent(claudeResponse.content),
    role: "assistant",
    finish_reason: claudeResponse.stop_reason || null,
    usage: {
      prompt_tokens: claudeResponse.usage.input_tokens,
      completion_tokens: claudeResponse.usage.output_tokens,
      total_tokens:
        claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens,
    },
  };
}

function convertOpenAIToStandardFormat(
  openAIResponse: OpenAI.Chat.Completions.ChatCompletion
): StandardizedChatCompletion {
  const choice = openAIResponse.choices[0];
  return {
    id: openAIResponse.id,
    object: openAIResponse.object,
    created: openAIResponse.created,
    model: openAIResponse.model,
    content: choice.message.content || "",
    role: "assistant",
    finish_reason: choice.finish_reason || null,
    usage: openAIResponse.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

function generateSquiggleSystemContent(): string {
  return `You are an AI assistant specialized in generating Squiggle code. Squiggle is a probabilistic programming language designed for estimation. Always respond with valid Squiggle code enclosed in triple backticks (\`\`\`). Do not give any more explanation, just provide the code and nothing else. Think through things, step by step.

Write the entire code, don't truncate it. So don't ever use "...", just write out the entire code. The code output you produce should be directly runnable in Squiggle, it shouldn't need any changes from users.

Here's the full Squiggle Documentation. It's important that all of the functions you use are contained here. Check this before finishing your work.

${squiggleDocs}

`;
}

export async function runLLM(
  conversationHistory: Message[]
): Promise<StandardizedChatCompletion> {
  const squiggleContext = generateSquiggleSystemContent();

  try {
    if (SELECTED_MODEL_CONFIG.provider === "anthropic") {
      const compressedMessages = compressAssistantMessages(conversationHistory);
      const claudeMessages = convertToClaudeMessages(compressedMessages);

      if (claudeMessages.length === 0) {
        throw new Error("At least one message is required");
      }

      const completion = await anthropic.beta.promptCaching.messages.create({
        max_tokens: 4000,
        messages: claudeMessages,
        model: SELECTED_MODEL_CONFIG.model,
        system: [
          {
            text: squiggleContext,
            type: "text",
            cache_control: { type: "ephemeral" },
          },
        ],
      });

      return convertClaudeToStandardFormat(completion);
    } else {
      // Use OpenAI (OpenRouter)
      const completion = await openai.chat.completions.create({
        model: SELECTED_MODEL_CONFIG.model,
        messages: [
          { role: "system", content: squiggleContext },
          ...conversationHistory,
        ],
      });

      return convertOpenAIToStandardFormat(completion);
    }
  } catch (error) {
    console.error("Error in API call:", error);
    throw error;
  }
}

function compressAssistantMessages(messages: Message[]): Message[] {
  return messages.reduce((acc, current, index, array) => {
    if (current.role !== "assistant") {
      acc.push(current);
    } else if (index === 0 || array[index - 1].role !== "assistant") {
      acc.push(current);
    } else {
      acc[acc.length - 1].content += "\n\n" + current.content;
    }
    return acc;
  }, [] as Message[]);
}

export function calculatePrice(
  inputTokens: number,
  outputTokens: number
): number {
  const { inputRate, outputRate } = SELECTED_MODEL_CONFIG;
  const inputCost = inputTokens * inputRate;
  const outputCost = outputTokens * outputRate;
  return inputCost + outputCost;
}
