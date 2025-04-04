import { MembershipRole, Prisma } from "@quri/hub-db";

import { auth } from "@/lib/server/auth";
import { findPaginated, makePaginated } from "@/lib/server/dataHelpers";
import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";

export type GroupMemberDTO = {
  id: string;
  role: MembershipRole;
  user: {
    slug: string;
  };
};

export const membershipSelect = {
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

type Row = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.userGroupMembership.findFirst<{
        select: typeof membershipSelect;
      }>
    >
  >
>;

export function membershipToDTO(row: Row): GroupMemberDTO {
  if (!row.user.asOwner) {
    // should never happen
    throw new Error("User is missing owner information");
  }

  return {
    id: row.id,
    role: row.role,
    user: { slug: row.user.asOwner.slug },
  };
}

export async function loadGroupMembers({
  limit = 20,
  cursor,
  ...params
}: {
  limit?: number;
  cursor?: string;
  groupSlug: string;
}): Promise<Paginated<GroupMemberDTO>> {
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
    select: membershipSelect,
    orderBy: { createdAt: "asc" },
    ...findPaginated(cursor, limit),
  });

  const members = rows.map(membershipToDTO);

  const nextCursor = members[members.length - 1]?.id;
  async function loadMore(limit: number) {
    "use server";
    return loadGroupMembers({ ...params, cursor: nextCursor, limit });
  }

  return makePaginated(members, limit, loadMore);
}

export async function loadMyMembership(params: {
  groupSlug: string;
}): Promise<GroupMemberDTO | null> {
  const session = await auth();

  // extra caution because we can - using id instead of slug or email
  const userId = session?.user.id;
  if (!userId) {
    return null;
  }

  const membership = await prisma.userGroupMembership.findFirst({
    where: {
      group: { asOwner: { slug: params.groupSlug } },
      user: { id: userId },
    },
    select: membershipSelect,
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
    select: membershipSelect,
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
