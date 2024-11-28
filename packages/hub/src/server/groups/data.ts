import "server-only";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/prisma";

import { Paginated } from "../models/data";

export async function getMyGroup(
  groupSlug: string
): Promise<GroupCardData | null> {
  const session = await auth();
  const userId = session?.user.id;
  if (!userId) {
    return null;
  }

  const group = await prisma.group.findFirst({
    select: groupCardSelect,
    where: {
      asOwner: { slug: groupSlug },
      memberships: {
        some: { userId },
      },
    },
  });
  if (!group) {
    return null;
  }
  return dbGroupToGroupCard(group);
}

export async function hasGroupMembership(groupSlug: string): boolean {
  return !!(await getMyGroup(groupSlug));
}

const groupCardSelect = {
  id: true,
  asOwner: {
    select: {
      slug: true,
    },
  },
  updatedAt: true,
} satisfies Prisma.GroupSelect;

type DbGroupCard = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.group.findFirst<{ select: typeof groupCardSelect }>
    >
  >
>;

export function dbGroupToGroupCard(dbGroup: DbGroupCard) {
  return {
    id: dbGroup.id,
    slug: dbGroup.asOwner.slug,
    updatedAt: dbGroup.updatedAt,
  };
}

export type GroupCardData = ReturnType<typeof dbGroupToGroupCard>;

export async function loadGroupCards(
  params: {
    username?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<Paginated<GroupCardData>> {
  const limit = params.limit ?? 20;

  const dbGroups = await prisma.group.findMany({
    select: groupCardSelect,
    orderBy: { updatedAt: "desc" },
    cursor: params.cursor ? { id: params.cursor } : undefined,
    where: {
      memberships: {
        some: {
          user: {
            asOwner: {
              slug: params.username,
            },
          },
        },
      },
    },
    take: limit + 1,
  });

  const groups = dbGroups.map(dbGroupToGroupCard);

  const nextCursor = groups[groups.length - 1]?.id;

  async function loadMore(limit: number) {
    "use server";
    return loadGroupCards({ ...params, cursor: nextCursor, limit });
  }

  return {
    items: groups.slice(0, limit),
    loadMore: groups.length > limit ? loadMore : undefined,
  };
}
