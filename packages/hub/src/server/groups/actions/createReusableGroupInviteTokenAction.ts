"use server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/prisma";
import { groupMembersRoute } from "@/routes";
import { makeServerAction, zSlug } from "@/server/utils";

import { loadMyMembership } from "../data/members";

export const createReusableGroupInviteTokenAction = makeServerAction(
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
  }
);
