// Common error class for LLM provider errors.
export class LLMError extends Error {
  constructor(
    message: string,
    // LLMStepInstance will use `kind` to decide whether the errors was critical or minor.
    public kind: "timeout" | "balance" | "other"
  ) {
    super(message);
  }
}
