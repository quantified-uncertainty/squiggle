import { Prisma } from "@quri/hub-db";

import { findPaginated, makePaginated } from "@/lib/server/dataHelpers";
import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";
import { OwnerDTO, selectOwner, toOwnerDTO } from "@/owners/data/owner";

export const definitionCardSelect = {
  id: true,
  slug: true,
  owner: {
    select: selectOwner,
  },
  updatedAt: true,
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
  owner: OwnerDTO;
  updatedAt: Date;
};

export function toDefinitionCardDTO(
  dbDefinition: DbDefinitionCard
): DefinitionCardDTO {
  return {
    id: dbDefinition.id,
    slug: dbDefinition.slug,
    owner: toOwnerDTO(dbDefinition.owner),
    updatedAt: dbDefinition.updatedAt,
  };
}

export type RelativeValuesDefinitionCardDTO = ReturnType<
  typeof toDefinitionCardDTO
>;

export async function loadDefinitionCards({
  limit = 20,
  cursor,
  ...params
}: {
  cursor?: string;
  limit?: number;
  username?: string;
} = {}): Promise<Paginated<RelativeValuesDefinitionCardDTO>> {
  const rows = await prisma.relativeValuesDefinition.findMany({
    select: definitionCardSelect,
    orderBy: { updatedAt: "desc" },
    where: params.username
      ? {
          owner: {
            slug: params.username,
          },
        }
      : undefined,
    ...findPaginated(cursor, limit),
  });

  const definitions = rows.map(toDefinitionCardDTO);

  const nextCursor = definitions[definitions.length - 1]?.id;
  async function loadMore(limit: number) {
    "use server";
    return loadDefinitionCards({ ...params, cursor: nextCursor, limit });
  }

  return makePaginated(definitions, limit, loadMore);
}

export async function loadRelativeValuesDefinitionCard(params: {
  owner: string;
  slug: string;
}): Promise<RelativeValuesDefinitionCardDTO | null> {
  const row = await prisma.relativeValuesDefinition.findFirst({
    select: definitionCardSelect,
    where: {
      owner: {
        slug: params.owner,
      },
      slug: params.slug,
    },
  });

  return row ? toDefinitionCardDTO(row) : null;
}
