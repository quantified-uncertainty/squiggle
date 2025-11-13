import { LlmId, MODEL_CONFIGS } from "../modelConfigs.js";
import { AnthropicProvider } from "./AnthropicProvider.js";
import { LLMError } from "./LLMError.js";
import { OpenAIProvider } from "./OpenAIProvider.js";
import { LlmMetrics, Message, StandardizedChatCompletion } from "./types.js";

const TIMEOUT_MINUTES = 3;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

export function calculatePriceMultipleCalls(
  metrics: Partial<Record<LlmId, LlmMetrics>>
): number {
  let totalCost = 0;

  for (const [llmId, { inputTokens, outputTokens }] of Object.entries(
    metrics
  )) {
    const modelConfig = MODEL_CONFIGS.find((model) => model.id === llmId);

    if (!modelConfig) {
      console.warn(`No pricing information found for LLM: ${llmId}`);
      continue;
    }

    const inputCost = (inputTokens * modelConfig.inputRate) / 1_000_000;
    const outputCost = (outputTokens * modelConfig.outputRate) / 1_000_000;
    totalCost += inputCost + outputCost;
  }

  return totalCost;
}

// Wrapper around various LLM provider clients; injects Squiggle context into the conversation.
export class LLMClient {
  private provider: AnthropicProvider | OpenAIProvider;

  constructor(
    public llmId: LlmId,
    openaiApiKey?: string,
    anthropicApiKey?: string,
    openrouterApiKey?: string
  ) {
    const selectedModelConfig = MODEL_CONFIGS.find(
      (model) => model.id === this.llmId
    );

    if (!selectedModelConfig) {
      throw new Error(`No model config found for LLM: ${this.llmId}`);
    }

    if (
      selectedModelConfig.provider === "openai" ||
      selectedModelConfig.provider === "openrouter"
    ) {
      const apiKey =
        selectedModelConfig.provider === "openai"
          ? openaiApiKey
          : openrouterApiKey;
      if (!apiKey) {
        throw new Error(`No ${selectedModelConfig.provider} API key provided`);
      }
      this.provider = new OpenAIProvider(
        apiKey,
        selectedModelConfig,
        selectedModelConfig.provider === "openrouter"
          ? {
              baseURL: "https://openrouter.ai/api/v1",
              defaultHeaders: {
                "HTTP-Referer": "https://squigglehub.org",
                "X-Title": "Squiggle Hub",
              },
            }
          : {}
      );
    } else if (selectedModelConfig.provider === "anthropic") {
      if (!anthropicApiKey) {
        throw new Error("No Anthropic API key provided");
      }
      this.provider = new AnthropicProvider(
        anthropicApiKey,
        selectedModelConfig
      );
    } else {
      throw new Error(
        `Unsupported model config: ${selectedModelConfig satisfies never}`
      );
    }
  }

  async run(
    conversationHistory: Message[]
  ): Promise<StandardizedChatCompletion> {
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () =>
            reject(
              new LLMError(
                `API call timed out after ${TIMEOUT_MS / 1000}s`,
                "timeout"
              )
            ),
          TIMEOUT_MS
        );
      });

      const completionPromise = this.provider.run(conversationHistory);

      const completion = await Promise.race([
        completionPromise,
        timeoutPromise,
      ]);

      return completion;
    } catch (error) {
      console.error("Error in API call:", error);
      throw error;
    } finally {
      // Always clear the timeout to prevent hanging event loop
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }
}
