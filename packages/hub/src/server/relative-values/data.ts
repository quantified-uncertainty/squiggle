import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/prisma";

import { Paginated } from "../models/data";

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
    where: {
      owner: {
        slug: params.username,
      },
    },
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
