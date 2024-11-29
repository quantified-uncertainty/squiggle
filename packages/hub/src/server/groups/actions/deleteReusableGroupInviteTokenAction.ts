"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/prisma";
import { groupMembersRoute } from "@/routes";
import { makeServerAction, zSlug } from "@/server/utils";

import { loadMyMembership } from "../data/members";

// Create or replace a reusable invite token for a group, available as \`reusableInviteToken\` field on group object.
// You must be an admin of the group to call this action. Previous invite token, if it existed, will stop working.
export const deleteReusableGroupInviteTokenAction = makeServerAction(
  z.object({
    slug: zSlug,
  }),
  async (input): Promise<void> => {
    const myMembership = await loadMyMembership({ groupSlug: input.slug });
    if (!myMembership) {
      throw new Error("Not a member of this group");
    }
    if (myMembership.role !== "Admin") {
      throw new Error("Only group admins can delete reusable invite tokens");
    }

    const group = await prisma.group.findFirstOrThrow({
      where: {
        asOwner: {
          slug: input.slug,
        },
      },
    });

    await prisma.group.update({
      where: { id: group.id },
      data: { reusableInviteToken: null },
    });

    revalidatePath(groupMembersRoute({ slug: input.slug }));
  }
);
