import "dotenv/config";

import { getAiEvaluator } from "./evals/aiEvaluator.js";
import { printEvalResultList, runEvalOnSpecList } from "./evals/index.js";
import { getMockSpecList } from "./specLists.js";

async function main() {
  const specSuite = await getMockSpecList();
  const evaluator = await getAiEvaluator();
  const evalResult = await runEvalOnSpecList(specSuite, evaluator);
  printEvalResultList(evalResult);
}

main();
