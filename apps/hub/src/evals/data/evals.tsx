import { Eval, EvalResult, Prisma, Spec } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

import { SpecList } from "./specLists";

// Selection for fetching eval data with detailed information
export const evalSelectWithDetails = {
  id: true,
  createdAt: true,
  updatedAt: true,
  evaluator: {
    select: {
      id: true,
      name: true,
      type: true,
    }
  },
  specList: {
    select: {
      id: true,
      name: true,
      specs: {
        select: {
          spec: true,
        },
      },
    },
  },
  evalResults: {
    select: {
      id: true,
      code: true,
      spec: true,
      workflow: {
        select: {
          id: true,
          markdown: true,
        },
      },
    },
  },
} satisfies Prisma.EvalSelect;

// Type for eval data with all details included
export type EvalWithDetails = Prisma.EvalGetPayload<{
  select: typeof evalSelectWithDetails;
}>;

export async function getAllEvals() {
  await checkRootUser();

  return prisma.eval.findMany({
    select: {
      id: true,
      createdAt: true,
      evaluator: {
        select: {
          id: true,
          name: true,
        }
      },
      specList: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          evalResults: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getEvalsBySpecListId(specListId: string) {
  await checkRootUser();

  return prisma.eval.findMany({
    where: {
      specListId,
    },
    select: {
      id: true,
      createdAt: true,
      evaluator: {
        select: {
          id: true,
          name: true,
        }
      },
      _count: {
        select: {
          evalResults: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getEvalById(id: string): Promise<EvalWithDetails> {
  await checkRootUser();

  return prisma.eval.findUniqueOrThrow({
    where: { id },
    select: evalSelectWithDetails,
  });
}

type EvaluatorResult = Pick<EvalResult, "specId" | "code" | "workflowId">;

// Evaluators are pluggable.
// The main one is Squiggle AI evaluator, but we can add more (e.g. prompting a human to evaluate, or loading resolved results from Metaforecast database).
export type Evaluator = (spec: Spec) => Promise<EvaluatorResult>;

export async function runEvalOnSpecList(
  specList: SpecList,
  evaluator: Evaluator
): Promise<Eval> {
  await checkRootUser();

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
