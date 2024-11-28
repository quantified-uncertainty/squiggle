import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/prisma";

import { modelWhereHasAccess } from "../models/data/authHelpers";
import { Paginated } from "../types";

const variableCardSelect = {
  id: true,
  variableName: true,
  currentRevision: {
    select: {
      id: true,
      title: true,
      docstring: true,
      variableType: true,
      modelRevision: {
        select: {
          createdAt: true,
        },
      },
    },
  },
  model: {
    select: {
      owner: {
        select: {
          slug: true,
        },
      },
      slug: true,
      isPrivate: true,
    },
  },
} satisfies Prisma.VariableSelect;

type DbVariableCard = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.variable.findFirst<{
        select: typeof variableCardSelect;
      }>
    >
  >
>;

export function dbVariableToVariableCard(dbVariable: DbVariableCard) {
  // TODO - upgrade owner, at least
  return dbVariable;
}

export type VariableCardData = ReturnType<typeof dbVariableToVariableCard>;

export async function loadVariableCards(
  params: {
    ownerSlug?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<Paginated<VariableCardData>> {
  const limit = params.limit ?? 20;

  const dbVariables = await prisma.variable.findMany({
    select: variableCardSelect,
    orderBy: {
      currentRevision: {
        modelRevision: {
          createdAt: "desc",
        },
      },
    },
    cursor: params.cursor ? { id: params.cursor } : undefined,
    where: {
      model: {
        OR: await modelWhereHasAccess(),
        ...(params.ownerSlug
          ? {
              owner: {
                slug: params.ownerSlug,
              },
            }
          : undefined),
      },
    },
    take: limit + 1,
  });

  const variables = dbVariables.map(dbVariableToVariableCard);

  const nextCursor = variables[variables.length - 1]?.id;

  async function loadMore(limit: number) {
    "use server";
    return loadVariableCards({ ...params, cursor: nextCursor, limit });
  }

  return {
    items: variables.slice(0, limit),
    loadMore: variables.length > limit ? loadMore : undefined,
  };
}
