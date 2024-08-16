#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
// import  { ContentBlock } from '@anthropic-ai/sdk';
import dotenv from "dotenv";
import OpenAI from "openai";

// Configuration
dotenv.config({ path: ".env.local" });

export const SELECTED_MODEL = "GPT-4o-mini";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

function convertToClaudeMessages(
  history: Message[]
): Anthropic.Messages.MessageParam[] {
  return history
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
}

// Helper function to extract text content from Claude API response
function extractTextContent(content: Anthropic.ContentBlock[]): string {
  return content
    .filter(
      (block): block is Extract<Anthropic.ContentBlock, { type: "text" }> =>
        block.type === "text"
    )
    .map((block) => block.text)
    .join("\n");
}

let conversationHistory: Message[] = [];

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
  content: string,
  role: "system" | "user" = "user"
): Promise<StandardizedChatCompletion> {
  conversationHistory.push({ role, content });

  try {
    if (SELECTED_MODEL === "Claude-3.5-Sonnet") {
      // Use Claude SDK with prompt caching
      const claudeMessages = convertToClaudeMessages(conversationHistory);
      const completion = await anthropic.messages.create({
        max_tokens: 4000,
        messages: claudeMessages,
        model: "claude-3-opus-20240229", // Adjust the model as needed
        system: conversationHistory.find((msg) => msg.role === "system")
          ?.content, // Add system message if present
      });

      const standardizedCompletion = convertClaudeToStandardFormat(completion);

      conversationHistory.push({
        role: "assistant",
        content: standardizedCompletion.content,
      });

      return standardizedCompletion;
    } else {
      // Use OpenAI (OpenRouter)
      const completion = await openai.chat.completions.create({
        model: OPENROUTER_MODEL,
        messages: conversationHistory,
      });

      const standardizedCompletion = convertOpenAIToStandardFormat(completion);

      conversationHistory.push({
        role: "assistant",
        content: standardizedCompletion.content,
      });

      return standardizedCompletion;
    }
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
