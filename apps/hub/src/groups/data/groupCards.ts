import { Prisma } from "@quri/hub-db";

import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";

const select = {
  id: true,
  asOwner: {
    select: {
      slug: true,
    },
  },
  updatedAt: true,
} satisfies Prisma.GroupSelect;

type DbGroupCard = NonNullable<
  Awaited<ReturnType<typeof prisma.group.findFirst<{ select: typeof select }>>>
>;

export type GroupCardDTO = {
  id: string;
  slug: string;
  updatedAt: Date;
};

export function toDTO(dbGroup: DbGroupCard): GroupCardDTO {
  return {
    id: dbGroup.id,
    slug: dbGroup.asOwner.slug,
    updatedAt: dbGroup.updatedAt,
  };
}

export async function loadGroupCards(
  params: {
    username?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<Paginated<GroupCardDTO>> {
  const limit = params.limit ?? 20;

  const dbGroups = await prisma.group.findMany({
    select: select,
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

  const groups = dbGroups.map(toDTO);

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

export async function loadGroupCard(
  groupSlug: string
): Promise<GroupCardDTO | null> {
  const group = await prisma.group.findFirst({
    select,
    where: { asOwner: { slug: groupSlug } },
  });
  return group ? toDTO(group) : null;
}

export async function getMyGroup(
  groupSlug: string
): Promise<GroupCardDTO | null> {
  const session = await auth();
  const userId = session?.user.id;
  if (!userId) {
    return null;
  }

  const group = await prisma.group.findFirst({
    select,
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
  return toDTO(group);
}
