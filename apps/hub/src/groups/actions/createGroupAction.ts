"use server";
import { z } from "zod";

import {
  actionClient,
  failValidationOnConstraint,
} from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { zSlug } from "@/lib/zodUtils";
import { indexGroupId } from "@/search/helpers";
import { getSelf, getSessionOrRedirect } from "@/users/auth";

const schema = z.object({
  slug: zSlug,
});

export const createGroupAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: input }): Promise<{ slug: string }> => {
    const session = await getSessionOrRedirect();
    const user = await getSelf(session);

    const group = await failValidationOnConstraint(
      () =>
        prisma.group.create({
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
        }),
      {
        schema,
        handlers: [
          {
            constraint: ["slug"],
            input: "slug",
            error: `Group ${input.slug} already exists`,
          },
        ],
      }
    );

    await indexGroupId(group.id);

    return { slug: input.slug };
  });
