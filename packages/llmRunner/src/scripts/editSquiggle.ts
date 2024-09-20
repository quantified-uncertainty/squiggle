import { runSquiggleWorkflowToResult } from "../squiggleWorkflow.js";

async function main() {
  const initialCode = `
  foo = 0 to 100
  bar = 30
  `;

  const { totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary } =
    await runSquiggleWorkflowToResult({
      input: { type: "Edit", source: initialCode },
      openaiApiKey: process.env["OPENROUTER_API_KEY"],
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
