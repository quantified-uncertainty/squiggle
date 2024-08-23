#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import OpenAI from "openai";

import { squiggleSystemContent } from "./prompts";

dotenv.config({ path: ".env.local" });

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
  maxTokens?: number;
};

const MODEL_CONFIGS: { [key: string]: ModelConfig } = {
  GPT4: {
    provider: "openrouter",
    model: "openai/gpt-4o-2024-08-06",
    inputRate: 0.0000025,
    outputRate: 0.00001,
    contextWindow: 128000,
  },
  "GPT4-mini": {
    provider: "openrouter",
    model: "openai/gpt-4o-mini-2024-07-18",
    inputRate: 0.00000015,
    outputRate: 0.0000006,
    contextWindow: 128000,
  },
  "Claude-Sonnet": {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20240620",
    inputRate: 0.000003,
    outputRate: 0.000015,
    contextWindow: 200000,
    maxTokens: 8192,
  },
  "Claude-Haiku": {
    provider: "anthropic",
    model: "claude-3-haiku-20240307",
    inputRate: 0.00000025,
    outputRate: 0.00000125,
    contextWindow: 200000,
    maxTokens: 4096,
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

export type LLMName = keyof typeof MODEL_CONFIGS;

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

export async function runLLM(
  conversationHistory: Message[],
  llmName: LLMName
): Promise<StandardizedChatCompletion> {
  const squiggleContext = squiggleSystemContent;
  const selectedModelConfig = MODEL_CONFIGS[llmName];

  try {
    if (selectedModelConfig.provider === "anthropic") {
      const compressedMessages = compressAssistantMessages(conversationHistory);
      const claudeMessages = convertToClaudeMessages(compressedMessages);

      if (claudeMessages.length === 0) {
        throw new Error("At least one message is required");
      }

      const completion = await anthropic.beta.promptCaching.messages.create({
        max_tokens: selectedModelConfig.maxTokens,
        messages: claudeMessages,
        model: selectedModelConfig.model,
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
        model: selectedModelConfig.model,
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

export interface LlmMetrics {
  apiCalls: number;
  inputTokens: number;
  outputTokens: number;
  llmName?: LLMName;
}

export function calculatePriceMultipleCalls(metrics: {
  [key: LLMName]: LlmMetrics;
}): number {
  let totalCost = 0;

  for (const llmName in metrics) {
    const { inputTokens, outputTokens } = metrics[llmName];
    const modelConfig = MODEL_CONFIGS[llmName];

    if (!modelConfig) {
      console.warn(`No pricing information found for LLM: ${llmName}`);
      continue;
    }

    const inputCost = inputTokens * modelConfig.inputRate;
    const outputCost = outputTokens * modelConfig.outputRate;
    totalCost += inputCost + outputCost;
  }

  return totalCost;
}
