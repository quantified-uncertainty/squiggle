export interface ModelInfo {
  presentedTitle: string;
  backendTitle: string;
  company: string;
  fullModelId: string;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    presentedTitle: "GPT-3.5",
    backendTitle: "gpt4-3.5-turbo",
    company: "OpenAI",
    fullModelId: "gpt-3.5-turbo",
  },
  {
    presentedTitle: "GPT-4 Turbo",
    backendTitle: "gpt4o",
    company: "OpenAI",
    fullModelId: "gpt-4o",
  },
  {
    presentedTitle: "Claude 3 Haiku",
    backendTitle: "haiku",
    company: "Anthropic",
    fullModelId: "claude-3-haiku-20240307",
  },
  {
    presentedTitle: "Claude 3 Sonnet",
    backendTitle: "sonnet",
    company: "Anthropic",
    fullModelId: "claude-3-5-sonnet-20240620",
  },
];
