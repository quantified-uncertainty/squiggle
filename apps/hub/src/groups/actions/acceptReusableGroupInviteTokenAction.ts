"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { groupMembersRoute } from "@/lib/routes";
import { actionClient, ActionError } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { zSlug } from "@/lib/zodUtils";
import { getSessionOrRedirect } from "@/users/auth";

import { validateReusableGroupInviteToken } from "../data/helpers";
import { loadMyMembership } from "../data/members";

export const acceptReusableGroupInviteTokenAction = actionClient
  .schema(
    z.object({
      groupSlug: zSlug,
      inviteToken: z.string(),
    })
  )
  .action(async ({ parsedInput: input }) => {
    const session = await getSessionOrRedirect();

    if (!(await validateReusableGroupInviteToken(input))) {
      throw new ActionError("Invalid token");
    }

    const group = await prisma.group.findFirstOrThrow({
      select: {
        id: true,
      },
      where: {
        asOwner: { slug: input.groupSlug },
      },
    });

    const myMembership = await loadMyMembership({
      groupSlug: input.groupSlug,
    });
    if (myMembership) {
      throw new ActionError("You're already a member of this group");
    }

    await prisma.userGroupMembership.create({
      data: {
        group: {
          connect: {
            id: group.id,
          },
        },
        user: {
          connect: {
            email: session.user.email,
          },
        },
        role: "Member",
      },
    });

    revalidatePath(groupMembersRoute({ slug: input.groupSlug }));
  });
