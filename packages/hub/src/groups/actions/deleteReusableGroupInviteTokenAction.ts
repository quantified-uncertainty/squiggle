"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { groupMembersRoute } from "@/lib/routes";
import { prisma } from "@/lib/server/prisma";
import { actionClient, ActionError } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";

import { loadMyMembership } from "../data/members";

// Disable a reusable invite token for a group.
export const deleteReusableGroupInviteTokenAction = actionClient
  .schema(
    z.object({
      slug: zSlug,
    })
  )
  .action(async ({ parsedInput: input }): Promise<void> => {
    const myMembership = await loadMyMembership({ groupSlug: input.slug });
    if (!myMembership) {
      throw new ActionError("Not a member of this group");
    }
    if (myMembership.role !== "Admin") {
      throw new ActionError(
        "Only group admins can delete reusable invite tokens"
      );
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
  });
