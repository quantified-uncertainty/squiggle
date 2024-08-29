import { LlmConfig, SquiggleGenerator } from "../main";

async function main() {
  const llmConfig: LlmConfig = {
    llmName: "Claude-Sonnet",
    priceLimit: 0.2,
    durationLimitMinutes: 1,
    messagesInHistoryToKeep: 4,
  };

  const prompt = "Add interesting detail to this code.";
  const initialCode = `
  foo = 0 to 100
  bar = 30
  `;

  const generator = new SquiggleGenerator(
    { type: "Edit", prompt, code: initialCode },
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
