"use server";
import { z } from "zod";

import { llmConfigSchema } from "@quri/squiggle-ai/server";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

// Input schema for creating an evaluator
const createEvaluatorSchema = z.object({
  name: z.string().min(1),
  config: llmConfigSchema,
});

export const createEvaluatorAction = actionClient
  .schema(createEvaluatorSchema)
  .action(async ({ parsedInput }) => {
    await checkRootUser();

    // Create the evaluator in the database
    const evaluator = await prisma.evaluator.create({
      data: {
        name: parsedInput.name,
        type: "SquiggleAI",
        config: parsedInput.config,
      },
    });

    return evaluator;
  });
