"use server";
import { z } from "zod";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

const schema = z.object({
  name: z.string().min(1),
});

export const createManifoldEpistemicAgentAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput }) => {
    await checkRootUser();

    const agent = await prisma.epistemicAgent.create({
      data: {
        name: parsedInput.name,
        type: "Manifold",
        config: {},
      },
    });

    return agent;
  });
