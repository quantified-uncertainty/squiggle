import "dotenv/config";

import fs from "fs/promises";
import path from "path";

import { getAiEvaluator } from "../evals/aiEvaluator.js";
import { printEvalResultList, runEvalOnSpecList } from "../evals/index.js";
import { getMockSpecList } from "../specLists.js";

async function main() {
  const specList = await getMockSpecList();

  const storeWorkflowsDir = path.join(
    process.cwd(),
    "ai-workflows",
    String(Date.now())
  );

  await fs.mkdir(storeWorkflowsDir, { recursive: true });
  const evaluator = await getAiEvaluator({
    storeWorkflowsDir,
  });
  const evalResultList = await runEvalOnSpecList(specList, evaluator);
  printEvalResultList(evalResultList);
}

main();
