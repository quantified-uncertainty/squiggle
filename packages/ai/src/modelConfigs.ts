// Model selection and pricing
type ModelConfig = {
  provider: "anthropic" | "openai";
  model: string;
  inputRate: number;
  outputRate: number;
  contextWindow: number;
  maxTokens?: number;
  name: string;
  id: string;
  allowsSystemPrompt: boolean;
};

// After some discussion, we decided to store this as an array of objects instead of a record. This is because it can be a pain to iterate and filter over records, and there aren't any significant performance benefits to using a record for this data.
export const MODEL_CONFIGS = [
  {
    id: "o1-preview",
    provider: "openai",
    model: "o1-preview",
    inputRate: 0.000015,
    outputRate: 0.00006,
    contextWindow: 128000,
    maxTokens: 32768,
    name: "o1 Preview",
    allowsSystemPrompt: false,
  },
  {
    id: "o1-mini",
    provider: "openai",
    model: "o1-mini-2024-09-12",
    inputRate: 0.000003,
    outputRate: 0.000012,
    contextWindow: 128000,
    maxTokens: 65536,
    name: "o1 Mini",
    allowsSystemPrompt: false,
  },
  {
    id: "GPT4",
    provider: "openai",
    model: "gpt-4o-2024-08-06",
    inputRate: 0.0000025,
    outputRate: 0.00001,
    contextWindow: 128000,
    name: "GPT-4o",
    allowsSystemPrompt: true,
  },
  {
    id: "GPT4-Fine-Tuned",
    provider: "openai",
    model:
      "ft:gpt-4o-2024-08-06:quantified-uncertainty-research-institute:squiggle-v02:ACWwi8V1",
    inputRate: 0.00000375,
    outputRate: 0.000015,
    contextWindow: 128000,
    name: "GPT-40 Fine-Tuned",
    allowsSystemPrompt: false,
  },
  {
    id: "GPT4-mini",
    provider: "openai",
    model: "gpt-4o-mini-2024-07-18",
    inputRate: 0.00000015,
    outputRate: 0.0000006,
    contextWindow: 128000,
    name: "GPT-4o mini",
    allowsSystemPrompt: true,
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
    allowsSystemPrompt: true,
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
    allowsSystemPrompt: true,
  },
] as const satisfies ModelConfig[];

export type LlmId = (typeof MODEL_CONFIGS)[number]["id"];
export type LlmName = (typeof MODEL_CONFIGS)[number]["name"];
