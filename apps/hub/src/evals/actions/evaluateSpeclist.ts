"use server";
import { z } from "zod";

import { actionClient, ActionError } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

const evaluateSpeclistSchema = z.object({
  specListId: z.string(),
  runnerId: z.string(),
});

export const evaluateSpecList = actionClient
  .schema(evaluateSpeclistSchema)
  .action(async ({ parsedInput: { specListId, runnerId } }) => {
    await checkRootUser();

    // Validate the runner exists
    const runnerExists = await prisma.evalRunner.findUnique({
      where: { id: runnerId },
    });

    if (!runnerExists) {
      throw new ActionError("Runner not found");
    }

    // Validate the speclist exists
    const specListExists = await prisma.specList.findUnique({
      where: { id: specListId },
    });

    if (!specListExists) {
      throw new ActionError("Spec list not found");
    }

    // Create a new Eval record with Pending state
    const evaluation = await prisma.evaluation.create({
      data: {
        state: "Pending",
        runner: {
          connect: {
            id: runnerId,
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
