import { Eval, EvalResult, Spec } from "@quri/hub-db";

import { prisma, SpecList } from "../specLists.js";

type EvaluatorResult = Pick<EvalResult, "specId" | "code" | "workflowId">;

// Evaluators are pluggable.
// The main one is Squiggle AI evaluator, but we can add more (e.g. prompting a human to evaluate, or loading resolved results from Metaforecast database).
export type Evaluator = (spec: Spec) => Promise<EvaluatorResult>;

export async function runEvalOnSpecList(
  specList: SpecList,
  evaluator: Evaluator
): Promise<Eval> {
  // create a new Eval record
  const evaluation = await prisma.eval.create({
    data: {
      evaluator: "anonymous", // TODO: named evaluators
      specList: {
        connect: {
          id: specList.id,
        },
      },
    },
  });

  // TODO - bring back Promise.all
  for (const spec of specList.specs) {
    const result = await evaluator(spec.spec);

    // store result in db
    await prisma.evalResult.create({
      data: {
        spec: {
          connect: {
            id: spec.spec.id,
          },
        },
        code: result.code,
        eval: {
          connect: {
            id: evaluation.id,
          },
        },
        ...(result.workflowId
          ? {
              workflow: {
                connect: {
                  id: result.workflowId,
                },
              },
            }
          : {}),
      },
    });
  }

  // reselect the Eval record from db
  return await prisma.eval.findUniqueOrThrow({
    where: {
      id: evaluation.id,
    },
  });
}

export async function printEvalResultList(evaluation: Eval) {
  const maxIdLength = 24;

  const results = await prisma.evalResult.findMany({
    where: {
      evalId: evaluation.id,
    },
  });

  for (const result of results) {
    let specId = result.specId;
    if (specId.length > maxIdLength) {
      specId = specId.slice(0, maxIdLength - 3) + "...";
    }
    console.log(specId.padEnd(maxIdLength), result.code);
  }
}
