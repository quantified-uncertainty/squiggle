import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/prisma";

import { Paginated } from "../types";

const definitionCardSelect = {
  id: true,
  slug: true,
  updatedAt: true,
  owner: {
    select: {
      slug: true,
    },
  },
} satisfies Prisma.RelativeValuesDefinitionSelect;

type DbDefinitionCard = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.relativeValuesDefinition.findFirst<{
        select: typeof definitionCardSelect;
      }>
    >
  >
>;

export function dbDefinitionToDefinitionCard(dbDefinition: DbDefinitionCard) {
  return {
    id: dbDefinition.id,
    slug: dbDefinition.slug,
    owner: {
      slug: dbDefinition.owner.slug,
    },
    updatedAt: dbDefinition.updatedAt,
  };
}

export type RelativeValuesDefinitionCardData = ReturnType<
  typeof dbDefinitionToDefinitionCard
>;

export async function loadDefinitionCards(
  params: {
    username?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<Paginated<RelativeValuesDefinitionCardData>> {
  const limit = params.limit ?? 20;

  const dbDefinitions = await prisma.relativeValuesDefinition.findMany({
    select: definitionCardSelect,
    orderBy: { updatedAt: "desc" },
    cursor: params.cursor ? { id: params.cursor } : undefined,
    where: params.username
      ? {
          owner: {
            slug: params.username,
          },
        }
      : undefined,
    take: limit + 1,
  });

  const definitions = dbDefinitions.map(dbDefinitionToDefinitionCard);

  const nextCursor = definitions[definitions.length - 1]?.id;

  async function loadMore(limit: number) {
    "use server";
    return loadDefinitionCards({ ...params, cursor: nextCursor, limit });
  }

  return {
    items: definitions.slice(0, limit),
    loadMore: definitions.length > limit ? loadMore : undefined,
  };
}
