#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
// import  { ContentBlock } from '@anthropic-ai/sdk';
import dotenv from "dotenv";
import OpenAI from "openai";

import { squiggleDocs } from "./helpers";

// Configuration
dotenv.config({ path: ".env.local" });

export const SELECTED_MODEL = "Claude-3.5-Sonnet";
// export const SELECTED_MODEL = "GPT-4o-mini";

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

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

function convertToClaudeMessages(history: Message[]): Anthropic.MessageParam[] {
  const messages = history
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

  return messages;
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
const CLAUDE_MODEL = "claude-3-5-sonnet-20240620";
// const CLAUDE_MODEL = "claude-3-haiku-20240307";

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
  // Always add the new message to the conversation history
  const squiggleContext = generateSquiggleSystemContent();

  try {
    if (SELECTED_MODEL === "Claude-3.5-Sonnet") {
      // Compress assistant messages for Claude
      const compressedMessages = compressAssistantMessages(conversationHistory);
      const claudeMessages = convertToClaudeMessages(compressedMessages);

      if (claudeMessages.length === 0) {
        throw new Error("At least one message is required");
      }

      const completion = await anthropic.beta.promptCaching.messages.create({
        max_tokens: 4000,
        messages: claudeMessages,
        model: CLAUDE_MODEL,
        system: [
          {
            text: squiggleContext,
            type: "text",
            cache_control: { type: "ephemeral" },
          },
        ],
      });

      const standardizedCompletion = convertClaudeToStandardFormat(completion);

      return standardizedCompletion;
    } else {
      // Use OpenAI (OpenRouter)
      const completion = await openai.chat.completions.create({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: squiggleContext },
          ...conversationHistory,
        ],
      });

      const standardizedCompletion = convertOpenAIToStandardFormat(completion);

      return standardizedCompletion;
    }
  } catch (error) {
    console.error("Error in API call:", error);
    throw error;
  }
}

// Helper function to compress assistant messages
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
  const { inputRate, outputRate } = MODEL_CONFIGS[SELECTED_MODEL];
  const inputCost = inputTokens * inputRate;
  const outputCost = outputTokens * outputRate;
  return inputCost + outputCost;
}
