import "dotenv/config";

import { loadWorkflowFromFile } from "../evals/aiEvaluator.js";

async function main() {
  const workflow = await loadWorkflowFromFile(process.argv[2]);
  console.log(workflow.getFinalResult().logSummary);
}

main();
