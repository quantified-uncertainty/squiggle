"use server";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { actionClient } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { indexGroupId } from "@/search/helpers";
import { getSessionOrRedirect } from "@/users/auth";

const schema = z.object({
  slug: zSlug,
});

export const createGroupAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: input }): Promise<{ slug: string }> => {
    const session = await getSessionOrRedirect();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email },
    });

    let group: { id: string };
    try {
      group = await prisma.group.create({
        data: {
          asOwner: {
            create: {
              slug: input.slug,
            },
          },
          memberships: {
            create: [{ userId: user.id, role: "Admin" }],
          },
        },
        select: { id: true },
      });
    } catch {
      returnValidationErrors(schema, {
        slug: {
          _errors: [`Group ${input.slug} already exists`],
        },
      });
    }

    await indexGroupId(group.id);

    return { slug: input.slug };
  });
