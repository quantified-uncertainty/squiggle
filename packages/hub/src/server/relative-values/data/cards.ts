import { Prisma } from "@prisma/client";

import { prisma } from "@/prisma";
import {
  selectTypedOwner,
  toTypedOwnerDTO,
  TypedOwner,
} from "@/server/owners/data/typedOwner";

import { Paginated } from "../../types";

export const definitionCardSelect = {
  id: true,
  slug: true,
  updatedAt: true,
  owner: {
    select: selectTypedOwner,
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

type DefinitionCardDTO = {
  id: string;
  slug: string;
  owner: TypedOwner;
  updatedAt: Date;
};

export function toDefinitionCardDTO(
  dbDefinition: DbDefinitionCard
): DefinitionCardDTO {
  return {
    id: dbDefinition.id,
    slug: dbDefinition.slug,
    owner: toTypedOwnerDTO(dbDefinition.owner),
    updatedAt: dbDefinition.updatedAt,
  };
}

export type RelativeValuesDefinitionCardDTO = ReturnType<
  typeof toDefinitionCardDTO
>;

export async function loadDefinitionCards(
  params: {
    username?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<Paginated<RelativeValuesDefinitionCardDTO>> {
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

  const definitions = dbDefinitions.map(toDefinitionCardDTO);

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

export async function loadRelativeValuesDefinitionCard(params: {
  owner: string;
  slug: string;
}): Promise<RelativeValuesDefinitionCardDTO | null> {
  const dbDefinition = await prisma.relativeValuesDefinition.findFirst({
    select: definitionCardSelect,
    where: {
      owner: {
        slug: params.owner,
      },
      slug: params.slug,
    },
  });

  return dbDefinition ? toDefinitionCardDTO(dbDefinition) : null;
}
