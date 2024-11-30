"use server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { makeServerAction, rethrowOnConstraint } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { indexGroupId } from "@/search/helpers";
import { getSessionOrRedirect } from "@/users/auth";

export const createGroupAction = makeServerAction(
  z.object({
    slug: zSlug,
  }),
  async (input): Promise<{ slug: string }> => {
    const session = await getSessionOrRedirect();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email },
    });

    const group = await rethrowOnConstraint(
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
        }),
      {
        target: ["slug"],
        error: `The group ${input.slug} already exists`,
      }
    );

    await indexGroupId(group.id);

    return { slug: input.slug };
  }
);
