"use server";
import { z } from "zod";

import { actionClient, ActionError } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

const evaluateQuestionSetSchema = z.object({
  questionSetId: z.string(),
  agentId: z.string(),
});

export const evaluateQuestionSet = actionClient
  .schema(evaluateQuestionSetSchema)
  .action(async ({ parsedInput: { questionSetId, agentId } }) => {
    await checkRootUser();

    // Validate the runner exists
    const agentExists = await prisma.epistemicAgent.findUnique({
      where: { id: agentId },
    });

    if (!agentExists) {
      throw new ActionError("Epistemic agent not found");
    }

    // Validate the speclist exists
    const questionSetExists = await prisma.questionSet.findUnique({
      where: { id: questionSetId },
    });

    if (!questionSetExists) {
      throw new ActionError("Question set not found");
    }

    // Create a new Eval record with Pending state
    const evaluation = await prisma.evaluation.create({
      data: {
        state: "Pending",
        agent: {
          connect: {
            id: agentId,
          },
        },
        questionSet: {
          connect: {
            id: questionSetId,
          },
        },
      },
    });

    // Return the created evaluation without processing specs
    // The background job will handle the actual processing
    return evaluation;
  });
