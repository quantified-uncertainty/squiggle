import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";
import { modelWhereCanRead } from "@/models/data/authHelpers";

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

type Row = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.variable.findFirst<{
        select: typeof variableCardSelect;
      }>
    >
  >
>;

export function toDTO(dbVariable: Row) {
  // TODO - upgrade owner, at least
  return dbVariable;
}

export type VariableCardDTO = ReturnType<typeof toDTO>;

export async function loadVariableCards(
  params: {
    ownerSlug?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<Paginated<VariableCardDTO>> {
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
      model: await modelWhereCanRead({
        ...(params.ownerSlug
          ? {
              owner: {
                slug: params.ownerSlug,
              },
            }
          : undefined),
      }),
    },
    take: limit + 1,
  });

  const variables = dbVariables.map(toDTO);

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

export async function loadVariableCard({
  owner,
  slug,
  variableName,
}: {
  owner: string;
  slug: string;
  variableName: string;
}) {
  const row = await prisma.variable.findFirst({
    where: {
      model: await modelWhereCanRead({
        owner: { slug: owner },
        slug,
      }),
      variableName,
    },
    select: variableCardSelect,
  });

  return row ? toDTO(row) : null;
}
