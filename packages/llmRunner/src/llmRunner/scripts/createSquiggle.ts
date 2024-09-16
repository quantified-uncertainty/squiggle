import { runSquiggleWorkflowToResult } from "../squiggleWorkflow";

async function main() {
  const prompt =
    "Generate a function that takes a list of numbers and returns the sum of the numbers";

  const { totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary } =
    await runSquiggleWorkflowToResult({
      input: { type: "Create", prompt },
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
