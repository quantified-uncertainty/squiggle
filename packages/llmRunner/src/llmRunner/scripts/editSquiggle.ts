import { LlmConfig, runSquiggleGeneratorToResult } from "../squiggleGenerator";

async function main() {
  const llmConfig: LlmConfig = {
    llmName: "Claude-Sonnet",
    priceLimit: 0.2,
    durationLimitMinutes: 1,
    messagesInHistoryToKeep: 4,
  };

  const initialCode = `
  foo = 0 to 100
  bar = 30
  `;

  const { totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary } =
    await runSquiggleGeneratorToResult({
      input: { type: "Edit", code: initialCode },
      llmConfig,
    });

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
