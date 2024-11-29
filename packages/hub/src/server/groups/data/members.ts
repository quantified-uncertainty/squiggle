import { MembershipRole, Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Paginated } from "@/server/types";

export type GroupMemberDTO = {
  id: string;
  role: MembershipRole;
  user: {
    slug: string;
  };
};

const select = {
  id: true,
  role: true,
  user: {
    select: {
      asOwner: {
        select: { slug: true },
      },
    },
  },
} satisfies Prisma.UserGroupMembershipSelect;

export const membershipSelect = select;

type Row = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.userGroupMembership.findFirst<{ select: typeof select }>
    >
  >
>;

export function membershipToDTO(row: Row): GroupMemberDTO {
  return {
    id: row.id,
    role: row.role,
    // guaranteed by the query
    user: { slug: row.user.asOwner!.slug },
  };
}

export async function loadGroupMembers(params: {
  groupSlug: string;
  cursor?: string;
  limit?: number;
}): Promise<Paginated<GroupMemberDTO>> {
  const limit = params.limit ?? 20;

  const rows = await prisma.userGroupMembership.findMany({
    where: {
      group: {
        asOwner: {
          slug: params.groupSlug,
        },
      },
      user: {
        asOwner: {
          isNot: null,
        },
      },
    },
    select,
    take: limit + 1,
  });

  const members = rows.map(membershipToDTO);

  const nextCursor = members[members.length - 1]?.id;

  async function loadMore(limit: number) {
    "use server";
    return loadGroupMembers({ ...params, cursor: nextCursor, limit });
  }

  return {
    items: members.slice(0, limit),
    loadMore: members.length > limit ? loadMore : undefined,
  };
}

export async function loadMyMembership(params: {
  groupSlug: string;
}): Promise<GroupMemberDTO | null> {
  const session = await auth();

  const userId = session?.user.id;
  if (!userId) {
    return null;
  }

  const membership = await prisma.userGroupMembership.findFirst({
    where: {
      group: { asOwner: { slug: params.groupSlug } },
      user: { id: userId },
    },
    select,
  });
  return membership ? membershipToDTO(membership) : null;
}

export async function loadMembership(params: {
  groupSlug: string;
  userSlug: string;
}): Promise<GroupMemberDTO | null> {
  const membership = await prisma.userGroupMembership.findFirst({
    where: {
      group: { asOwner: { slug: params.groupSlug } },
      user: { asOwner: { slug: params.userSlug } },
    },
    select,
  });
  return membership ? membershipToDTO(membership) : null;
}

export async function loadReusableInviteToken(params: {
  groupSlug: string;
}): Promise<string | null> {
  const myMembership = await loadMyMembership({ groupSlug: params.groupSlug });
  if (myMembership?.role !== "Admin") {
    throw new Error("Not an admin");
  }

  const group = await prisma.group.findFirst({
    where: { asOwner: { slug: params.groupSlug } },
    select: { reusableInviteToken: true },
  });

  return group?.reusableInviteToken ?? null;
}
