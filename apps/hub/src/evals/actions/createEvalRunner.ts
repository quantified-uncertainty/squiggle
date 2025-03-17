"use server";
import { z } from "zod";

import { llmConfigSchema } from "@quri/squiggle-ai/server";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

// Input schema for creating an eval runner
const createEvalRunnerSchema = z.object({
  name: z.string().min(1),
  config: llmConfigSchema,
});

export const createEvalRunnerAction = actionClient
  .schema(createEvalRunnerSchema)
  .action(async ({ parsedInput }) => {
    await checkRootUser();

    // Create the eval runner in the database
    const runner = await prisma.evalRunner.create({
      data: {
        name: parsedInput.name,
        type: "SquiggleAI",
        config: parsedInput.config,
      },
    });

    return runner;
  });
