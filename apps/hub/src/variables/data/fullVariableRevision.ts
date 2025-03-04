import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { modelWhereHasAccess } from "@/models/data/authHelpers";
import {
  ModelRevisionFullDTO,
  modelRevisionFullToDTO,
  selectModelRevisionFull,
} from "@/models/data/fullRevision";

const select = {
  id: true,
  variableType: true,
  variableName: true,
  modelRevision: {
    select: selectModelRevisionFull,
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

export type VariableRevisionFullDTO = {
  id: string;
  variableType: string;
  variableName: string;
  modelRevision: ModelRevisionFullDTO;
};

async function toDTO(row: Row): Promise<VariableRevisionFullDTO> {
  return {
    id: row.id,
    variableType: row.variableType,
    variableName: row.variableName,
    modelRevision: await modelRevisionFullToDTO(row.modelRevision),
  };
}

export async function loadVariableRevisionFull({
  owner,
  slug,
  variableName,
  revisionId,
}: {
  owner: string;
  slug: string;
  variableName: string;
  revisionId: string;
}): Promise<VariableRevisionFullDTO | null> {
  const row = await prisma.variableRevision.findFirst({
    where: {
      id: revisionId,
      modelRevision: {
        model: {
          OR: await modelWhereHasAccess(),
          owner: {
            slug: owner,
          },
          slug,
        },
      },
    },
    select,
  });

  return row ? await toDTO(row) : null;
}
