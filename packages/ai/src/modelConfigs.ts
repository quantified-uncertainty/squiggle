// Model selection and pricing
type ModelConfig = {
  provider: "anthropic" | "openrouter";
  model: string;
  inputRate: number;
  outputRate: number;
  contextWindow: number;
  maxTokens?: number;
  name: string;
  id: string;
};

export const MODEL_CONFIGS = [
  {
    id: "GPT4",
    provider: "openrouter",
    model: "openai/gpt-4o-2024-08-06",
    inputRate: 0.0000025,
    outputRate: 0.00001,
    contextWindow: 128000,
    name: "GPT-4o",
  },
  {
    id: "GPT4-mini",
    provider: "openrouter",
    model: "openai/gpt-4o-mini-2024-07-18",
    inputRate: 0.00000015,
    outputRate: 0.0000006,
    contextWindow: 128000,
    name: "GPT-4o mini",
  },
  {
    id: "Claude-Sonnet",
    provider: "anthropic",
    model: "claude-3-5-sonnet-20240620",
    inputRate: 0.000003,
    outputRate: 0.000015,
    contextWindow: 200000,
    maxTokens: 8192,
    name: "Claude Sonnet 3.5",
  },
  {
    id: "Claude-Haiku",
    provider: "anthropic",
    model: "claude-3-haiku-20240307",
    inputRate: 0.00000025,
    outputRate: 0.00000125,
    contextWindow: 200000,
    maxTokens: 4096,
    name: "Claude Haiku",
  },
  {
    id: "DeepSeek-Coder-V2",
    provider: "openrouter",
    model: "deepseek/deepseek-coder",
    inputRate: 0.00000014,
    outputRate: 0.00000028,
    contextWindow: 128000,
    name: "DeepSeek Coder V2",
  },
  {
    id: "Llama-3.1",
    provider: "openrouter",
    model: "meta-llama/llama-3.1-405b-instruct",
    inputRate: 0.0000027,
    outputRate: 0.0000027,
    contextWindow: 131072,
    name: "Llama 3.1",
  },
] as const;

export type LlmId = (typeof MODEL_CONFIGS)[number]["id"];
export type LlmName = (typeof MODEL_CONFIGS)[number]["name"];
