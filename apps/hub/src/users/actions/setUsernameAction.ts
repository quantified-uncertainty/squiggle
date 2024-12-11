"use server";

import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { actionClient, ActionError } from "@/lib/server/actionClient";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

const schema = z.object({
  username: z.string().min(1),
});

export const setUsernameAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: input }): Promise<"ok"> => {
    const session = await auth();
    if (!session?.user.email) {
      throw new ActionError("Not signed in");
    }
    if (session.user.username) {
      throw new ActionError("Username is already set");
    }

    const existingOwner = await prisma.owner.count({
      where: { slug: input.username },
    });
    if (existingOwner) {
      returnValidationErrors(schema, {
        username: {
          _errors: [`Username ${input.username} is not available`],
        },
      });
    }

    await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        asOwner: {
          create: { slug: input.username },
        },
      },
    });

    return "ok";
  });
