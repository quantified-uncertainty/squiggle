import { Prisma } from "@prisma/client";

import { prisma } from "@/prisma";
import { modelWhereHasAccess } from "@/server/models/data/authHelpers";
import {
  ModelRevisionDTO,
  modelRevisionToDTO,
  selectModelRevision,
} from "@/server/models/data/revisions";
import { Paginated } from "@/server/types";

const select = {
  id: true,
  variableType: true,
  modelRevision: {
    select: selectModelRevision,
  },
} satisfies Prisma.VariableRevisionSelect;

type Row = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.variableRevision.findFirst<{
        select: typeof select;
      }>
    >
  >
>;

export type VariableRevisionDTO = {
  id: string;
  variableType: string;
  modelRevision: ModelRevisionDTO;
};

function toDTO(row: Row): VariableRevisionDTO {
  return {
    id: row.id,
    variableType: row.variableType,
    modelRevision: modelRevisionToDTO(row.modelRevision),
  };
}

export async function loadVariableRevisions(params: {
  owner: string;
  slug: string;
  variableName: string;
  cursor?: string;
  limit?: number;
}): Promise<Paginated<VariableRevisionDTO>> {
  const limit = params.limit ?? 20;

  const rows = await prisma.variableRevision.findMany({
    select,
    orderBy: {
      modelRevision: {
        createdAt: "desc",
      },
    },
    cursor: params.cursor ? { id: params.cursor } : undefined,
    where: {
      modelRevision: {
        model: {
          OR: await modelWhereHasAccess(),
          owner: {
            slug: params.owner,
          },
          slug: params.slug,
        },
      },
    },
    take: limit + 1,
  });

  const variables = rows.map(toDTO);

  const nextCursor = variables[variables.length - 1]?.id;

  async function loadMore(limit: number) {
    "use server";
    return loadVariableRevisions({ ...params, cursor: nextCursor, limit });
  }

  return {
    items: variables.slice(0, limit),
    loadMore: variables.length > limit ? loadMore : undefined,
  };
}
