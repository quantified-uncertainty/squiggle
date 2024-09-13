import dotenv from "dotenv";

import { LlmConfig, runSquiggleGenerator } from "../squiggleGenerator";

// Load environment variables from .env file in the project root
dotenv.config();

async function main() {
  const llmConfig: LlmConfig = {
    llmName: "Claude-Sonnet",
    priceLimit: 0.2,
    durationLimitMinutes: 1,
    messagesInHistoryToKeep: 4,
  };

  const prompt =
    "Generate a function that takes a list of numbers and returns the sum of the numbers";

  const { totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary } =
    await runSquiggleGenerator({
      input: { type: "Create", prompt },
      llmConfig,
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
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
