"use server";
import { z } from "zod";

import { llmConfigSchema } from "@quri/squiggle-ai/server";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

// Input schema for creating an epistemic agent
const createEpistemicAgentSchema = z.object({
  name: z.string().min(1),
  config: llmConfigSchema,
});

export const createEpistemicAgentAction = actionClient
  .schema(createEpistemicAgentSchema)
  .action(async ({ parsedInput }) => {
    await checkRootUser();

    // Create the epistemic agent in the database
    const agent = await prisma.epistemicAgent.create({
      data: {
        name: parsedInput.name,
        type: "SquiggleAI",
        config: parsedInput.config,
      },
    });

    return agent;
  });
