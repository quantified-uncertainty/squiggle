import { Prisma } from "@quri/hub-db";

import { auth } from "@/lib/server/auth";
import { findPaginated, makePaginated } from "@/lib/server/dataHelpers";
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

export async function loadGroupCards({
  limit = 20,
  cursor,
  ...params
}: {
  limit?: number;
  cursor?: string;
  username?: string;
} = {}): Promise<Paginated<GroupCardDTO>> {
  const dbGroups = await prisma.group.findMany({
    select: select,
    orderBy: { updatedAt: "desc" },
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
    ...findPaginated(cursor, limit),
  });

  const groups = dbGroups.map(toDTO);

  const nextCursor = groups[groups.length - 1]?.id;
  async function loadMore(limit: number) {
    "use server";
    return loadGroupCards({ ...params, cursor: nextCursor, limit });
  }

  return makePaginated(groups, limit, loadMore);
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
