// Common error class for OpenAI and Anthropic errors.
export class LLMError extends Error {
  constructor(
    message: string,
    public kind: "timeout" | "balance" | "other"
  ) {
    super(message);
  }
}
