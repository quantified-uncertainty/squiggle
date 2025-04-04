import { Prisma } from "@quri/hub-db";

import { findPaginated, makePaginated } from "@/lib/server/dataHelpers";
import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";
import { modelWhereCanRead } from "@/models/authHelpers";

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
  // TODO - explicitly upgrade each field to DTO
  return dbVariable;
}

export type VariableCardDTO = ReturnType<typeof toDTO>;

export async function loadVariableCards({
  limit = 20,
  cursor,
  ...params
}: {
  limit?: number;
  cursor?: string;
  ownerSlug?: string;
} = {}): Promise<Paginated<VariableCardDTO>> {
  const rows = await prisma.variable.findMany({
    select: variableCardSelect,
    orderBy: {
      currentRevision: {
        modelRevision: {
          createdAt: "desc",
        },
      },
    },
    where: {
      model: await modelWhereCanRead(
        params.ownerSlug
          ? {
              owner: {
                slug: params.ownerSlug,
              },
            }
          : {}
      ),
    },
    ...findPaginated(cursor, limit),
  });

  const variables = rows.map(toDTO);

  const nextCursor = variables[variables.length - 1]?.id;
  async function loadMore(limit: number) {
    "use server";
    return loadVariableCards({ ...params, cursor: nextCursor, limit });
  }

  return makePaginated(variables, limit, loadMore);
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
