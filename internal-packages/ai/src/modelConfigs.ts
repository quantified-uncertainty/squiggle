// Model selection and pricing
export type ModelConfig = {
  provider: "anthropic" | "openai" | "openrouter";
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
    inputRate: 15,
    outputRate: 60,
    contextWindow: 128000,
    maxTokens: 32768,
    name: "o1 Preview",
    allowsSystemPrompt: false,
  },
  {
    id: "o1-mini",
    provider: "openai",
    model: "o1-mini-2024-09-12",
    inputRate: 3,
    outputRate: 12,
    contextWindow: 128000,
    maxTokens: 65536,
    name: "o1 Mini",
    allowsSystemPrompt: false,
  },
  {
    id: "GPT4o",
    provider: "openai",
    model: "gpt-4o-2024-08-06",
    inputRate: 2.5,
    outputRate: 10,
    contextWindow: 128000,
    name: "GPT-4o",
    allowsSystemPrompt: true,
  },
  {
    id: "GPT4-Fine-Tuned",
    provider: "openai",
    model:
      "ft:gpt-4o-2024-08-06:quantified-uncertainty-research-institute:squiggle-v02:ACWwi8V1",
    inputRate: 3.75,
    outputRate: 15,
    contextWindow: 128000,
    name: "GPT-4o Fine-Tuned",
    allowsSystemPrompt: false,
  },
  {
    id: "GPT4-mini",
    provider: "openai",
    model: "gpt-4o-mini-2024-07-18",
    inputRate: 0.15,
    outputRate: 0.6,
    contextWindow: 128000,
    name: "GPT-4o mini",
    allowsSystemPrompt: true,
  },
  {
    id: "Claude-4-5-Sonnet",
    provider: "anthropic",
    model: "claude-sonnet-4-5-20250929",
    inputRate: 3,
    outputRate: 15,
    contextWindow: 200000,
    maxTokens: 8192,
    name: "Claude Sonnet 4.5",
    allowsSystemPrompt: true,
  },
  {
    id: "Claude-3-7-Sonnet",
    provider: "anthropic",
    model: "claude-3-7-sonnet-latest",
    inputRate: 3,
    outputRate: 15,
    contextWindow: 200000,
    maxTokens: 8192,
    name: "Claude Sonnet 3.7",
    allowsSystemPrompt: true,
  },
  {
    id: "Claude-3-5-Haiku",
    provider: "anthropic",
    model: "claude-3-5-haiku-latest",
    inputRate: 1.0,
    outputRate: 3.0,
    contextWindow: 200000,
    maxTokens: 8192,
    name: "Claude Haiku 3.5",
    allowsSystemPrompt: true,
  },
  {
    id: "Claude-4-5-Haiku",
    provider: "anthropic",
    model: "claude-haiku-4-5",
    inputRate: 1.0,
    outputRate: 5.0,
    contextWindow: 200000,
    maxTokens: 8192,
    name: "Claude Haiku 4.5",
    allowsSystemPrompt: true,
  },
  {
    id: "Grok-Code-Fast-1",
    provider: "openrouter",
    model: "x-ai/grok-code-fast-1",
    inputRate: 0.2,
    outputRate: 1.5,
    contextWindow: 256000,
    maxTokens: 10000,
    name: "xAI: Grok Code Fast 1",
    allowsSystemPrompt: true,
  },
  {
    id: "GLM-4-6",
    provider: "openrouter",
    model: "z-ai/glm-4.6",
    inputRate: 0.4,
    outputRate: 1.75,
    contextWindow: 202752,
    maxTokens: 10000,
    name: "Z.AI: GLM 4.6",
    allowsSystemPrompt: true,
  },
  {
    id: "Gemini-2-5-Pro",
    provider: "openrouter",
    model: "google/gemini-2.5-pro",
    inputRate: 1.25,
    outputRate: 10,
    contextWindow: 1048576,
    maxTokens: 65536,
    name: "Google: Gemini 2.5 Pro",
    allowsSystemPrompt: true,
  },
  {
    id: "MiniMax-M2",
    provider: "openrouter",
    model: "minimax/minimax-m2",
    inputRate: 0.15,
    outputRate: 0.45,
    contextWindow: 196608,
    maxTokens: 196608,
    name: "MiniMax: MiniMax M2",
    allowsSystemPrompt: true,
  },
  {
    id: "Grok-4-Fast",
    provider: "openrouter",
    model: "x-ai/grok-4-fast",
    inputRate: 0.2,
    outputRate: 0.5,
    contextWindow: 2000000,
    maxTokens: 30000,
    name: "xAI: Grok 4 Fast",
    allowsSystemPrompt: true,
  },
  {
    id: "Qwen3-Coder",
    provider: "openrouter",
    model: "qwen/qwen3-coder",
    inputRate: 0.22,
    outputRate: 0.95,
    contextWindow: 262144,
    maxTokens: 262144,
    name: "Qwen: Qwen3 Coder 480B A35B",
    allowsSystemPrompt: true,
  },
] as const satisfies ModelConfig[];

export type LlmId = (typeof MODEL_CONFIGS)[number]["id"];
export type LlmName = (typeof MODEL_CONFIGS)[number]["name"];

export const DEFAULT_LLM_ID: LlmId = "Claude-4-5-Sonnet";
