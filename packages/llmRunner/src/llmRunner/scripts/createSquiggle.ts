import { LlmConfig, SquiggleGenerator } from "../main";

async function main() {
  const llmConfig: LlmConfig = {
    llmName: "Claude-Sonnet",
    priceLimit: 0.2,
    durationLimitMinutes: 1,
    messagesInHistoryToKeep: 4,
  };

  const prompt =
    "Generate a function that takes a list of numbers and returns the sum of the numbers";

  const generator = new SquiggleGenerator(
    { type: "Create", prompt },
    llmConfig
  );

  // Run the generator steps until completion
  while (!(await generator.step())) {}

  const { totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary } =
    generator.getFinalResult();

  const response = {
    code: typeof code === "string" ? code : "",
    isValid,
    totalPrice,
    runTimeMs,
    llmRunCount,
    logSummary,
  };

  console.log(JSON.stringify(response, null, 2));
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
