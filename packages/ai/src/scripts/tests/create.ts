import { config } from "dotenv";

import { SquiggleWorkflow } from "../../workflows/SquiggleWorkflow.js";

config();

async function main() {
  const prompt =
    "Generate a function that takes a list of numbers and returns the sum of the numbers";

  const { totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary } =
    await new SquiggleWorkflow({
      input: { type: "Create", prompt },
      openaiApiKey: process.env["OPENAI_API_KEY"],
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
    }).runToResult();

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
