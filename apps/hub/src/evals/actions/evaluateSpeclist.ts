"use server";
import { z } from "zod";

import { actionClient, ActionError } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

import { getAiEvaluator } from "../aiEvaluator";

const evaluateSpeclistSchema = z.object({
  specListId: z.string(),
  evaluatorId: z.string(),
});

export const evaluateSpecList = actionClient
  .schema(evaluateSpeclistSchema)
  .action(async ({ parsedInput: { specListId, evaluatorId } }) => {
    await checkRootUser();

    // Get the evaluator
    const evaluator = await getAiEvaluator({ id: evaluatorId });
    if (!evaluator) {
      throw new ActionError("Evaluator not found");
    }

    // Get the speclist
    const specList = await prisma.specList.findUniqueOrThrow({
      where: { id: specListId },
      include: { specs: { include: { spec: true } } },
    });

    // create a new Eval record
    const evaluation = await prisma.eval.create({
      data: {
        evaluator: {
          connect: {
            id: evaluatorId,
          },
        },
        specList: {
          connect: {
            id: specListId,
          },
        },
      },
    });

    // TODO - bring back Promise.all, or an async background job
    for (const { spec } of specList.specs) {
      const result = await evaluator(spec);

      // store result in db
      await prisma.evalResult.create({
        data: {
          spec: {
            connect: {
              id: spec.id,
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
    const updatedEvaluation = await prisma.eval.findUniqueOrThrow({
      where: {
        id: evaluation.id,
      },
    });

    return updatedEvaluation;
  });
