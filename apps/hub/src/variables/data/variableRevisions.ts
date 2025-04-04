import { Prisma } from "@quri/hub-db";

import { findPaginated, makePaginated } from "@/lib/server/dataHelpers";
import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";
import { modelWhereCanRead } from "@/models/authHelpers";
import {
  ModelRevisionDTO,
  modelRevisionToDTO,
  selectModelRevision,
} from "@/models/data/revisions";

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

export async function loadVariableRevisions({
  limit = 20,
  cursor,
  ...params
}: {
  owner: string;
  slug: string;
  variableName: string;
  cursor?: string;
  limit?: number;
}): Promise<Paginated<VariableRevisionDTO>> {
  const rows = await prisma.variableRevision.findMany({
    select,
    orderBy: {
      modelRevision: {
        createdAt: "desc",
      },
    },
    where: {
      modelRevision: {
        model: await modelWhereCanRead({
          owner: {
            slug: params.owner,
          },
          slug: params.slug,
        }),
      },
    },
    ...findPaginated(cursor, limit),
  });

  const variables = rows.map(toDTO);

  const nextCursor = variables[variables.length - 1]?.id;
  async function loadMore(limit: number) {
    "use server";
    return loadVariableRevisions({ ...params, cursor: nextCursor, limit });
  }

  return makePaginated(variables, limit, loadMore);
}
