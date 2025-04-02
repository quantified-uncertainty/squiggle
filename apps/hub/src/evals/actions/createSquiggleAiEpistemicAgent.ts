"use server";
import { z } from "zod";

import { llmConfigSchema } from "@quri/squiggle-ai/server";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

const schema = z.object({
  name: z.string().min(1),
  config: llmConfigSchema,
});

export const createSquiggleAiEpistemicAgentAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput }) => {
    await checkRootUser();

    // TODO - support group-owned agents
    const owner = await getWriteableOwnerOrSelf();

    const agent = await prisma.epistemicAgent.create({
      data: {
        name: parsedInput.name,
        type: "SquiggleAI",
        config: parsedInput.config,
        ownerId: owner.id,
      },
    });

    return agent;
  });
