import "dotenv/config";

import { loadSpecEvalResult } from "../evals/aiEvaluator.js";
import {
  EvalResult,
  EvalResultList,
  printEvalResultList,
} from "../evals/index.js";
import { getMockSpecList, SpecList } from "../specLists.js";

async function loadEvalResultList(
  specList: SpecList,
  dir: string
): Promise<EvalResultList> {
  const results: EvalResult[] = [];
  for (const spec of specList.specs) {
    const evalResult = await loadSpecEvalResult({
      dir,
      spec,
    });
    results.push(evalResult);
  }

  return {
    specList,
    results,
  };
}

async function main() {
  const dir = process.argv[2];
  const specList = await getMockSpecList();

  const evalResultList = await loadEvalResultList(specList, dir);

  printEvalResultList(evalResultList);
}

main();
