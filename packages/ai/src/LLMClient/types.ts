import { LlmId } from "../modelConfigs.js";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmMetrics = {
  apiCalls: number;
  inputTokens: number;
  outputTokens: number;
  llmId: LlmId;
};

export type StandardizedChatCompletion = {
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
};
