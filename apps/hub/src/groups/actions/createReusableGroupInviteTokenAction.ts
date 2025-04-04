"use server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { groupMembersRoute } from "@/lib/routes";
import { actionClient, ActionError } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { zSlug } from "@/lib/zodUtils";

import { loadMyMembership } from "../data/members";

/*
 * Create or replace a reusable invite token for a group, available as
 * \`reusableInviteToken\` field on group object.
 *
 * You must be an admin of the group to call this mutation. Previous invite
 * token, if it existed, will stop working.
 */
export const createReusableGroupInviteTokenAction = actionClient
  .schema(
    z.object({
      slug: zSlug,
    })
  )
  .action(async ({ parsedInput: input }): Promise<void> => {
    const myMembership = await loadMyMembership({ groupSlug: input.slug });
    if (!myMembership) {
      throw new ActionError("You're not a member of this group");
    }
    if (myMembership.role !== "Admin") {
      throw new ActionError("You're not an admin of this group");
    }

    const group = await prisma.group.findFirstOrThrow({
      where: {
        asOwner: {
          slug: input.slug,
        },
      },
    });

    const token = crypto.randomBytes(30).toString("hex");

    await prisma.group.update({
      where: {
        id: group.id,
      },
      data: {
        // old token will be overwritten, that's fine
        reusableInviteToken: token,
      },
      select: { id: true },
    });

    revalidatePath(groupMembersRoute({ slug: input.slug }));
  });
