import { Spec, SpecList } from "../specLists.js";

type EvalResult = {
  specId: string;
  result: string;
};

type EvalResultList = {
  specList: SpecList;
  results: EvalResult[];
};

export type Evaluator = (spec: Spec) => Promise<EvalResult>;

export async function runEvalOnSpecList(
  specList: SpecList,
  evaluator: Evaluator
): Promise<EvalResultList> {
  return {
    specList: specList,
    results: await Promise.all(
      specList.specs.map(async (spec) => evaluator(spec))
    ),
  };
}

export function printEvalResultList(evalResultList: EvalResultList) {
  const maxIdLength = 24;
  for (const result of evalResultList.results) {
    let specId = result.specId;
    if (specId.length > maxIdLength) {
      specId = specId.slice(0, maxIdLength - 3) + "...";
    }
    console.log(specId.padEnd(maxIdLength), result.result);
  }
}
