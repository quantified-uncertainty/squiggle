import { Prisma } from "@prisma/client";

import { prisma } from "@/prisma";
import { modelWhereHasAccess } from "@/server/models/data/authHelpers";

import { RelativeValuesDefinitionFullDTO } from "./full";

const select = {
  id: true,
  variableName: true,
  modelRevision: {
    select: {
      model: {
        select: {
          slug: true,
          isPrivate: true,
          owner: { select: { slug: true } },
        },
      },
    },
  },
} satisfies Prisma.RelativeValuesExportSelect;

export type RelativeValuesExportCardDTO = {
  id: string;
  variableName: string;
  modelRevision: {
    model: {
      slug: string;
      isPrivate: boolean;
      owner: { slug: string };
    };
  };
};

function toDTO(
  row: Prisma.RelativeValuesExportGetPayload<{
    select: typeof select;
  }>
): RelativeValuesExportCardDTO {
  return {
    id: row.id,
    variableName: row.variableName,
    modelRevision: {
      model: {
        slug: row.modelRevision.model.slug,
        isPrivate: row.modelRevision.model.isPrivate,
        owner: { slug: row.modelRevision.model.owner.slug },
      },
    },
  };
}

export async function loadRelativeValuesExportCardsFromDefinition(
  definition: RelativeValuesDefinitionFullDTO
): Promise<RelativeValuesExportCardDTO[]> {
  const models = await prisma.model.findMany({
    where: {
      currentRevision: {
        relativeValuesExports: {
          some: {
            definitionId: definition.id,
          },
        },
      },
      OR: await modelWhereHasAccess(),
    },
  });

  const rows = await prisma.relativeValuesExport.findMany({
    where: {
      modelRevisionId: {
        in: models
          .map((model) => model.currentRevisionId)
          .filter((id) => id !== null),
      },
      definitionId: definition.id,
    },
    select,
  });

  return rows.map(toDTO);
}
