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

    // Validate the evaluator exists
    const evaluatorExists = await prisma.evaluator.findUnique({
      where: { id: evaluatorId },
    });
    
    if (!evaluatorExists) {
      throw new ActionError("Evaluator not found");
    }

    // Validate the speclist exists
    const specListExists = await prisma.specList.findUnique({
      where: { id: specListId },
    });
    
    if (!specListExists) {
      throw new ActionError("Spec list not found");
    }

    // Create a new Eval record with Pending state
    const evaluation = await prisma.eval.create({
      data: {
        state: "Pending",
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

    // Return the created evaluation without processing specs
    // The background job will handle the actual processing
    return evaluation;
  });
