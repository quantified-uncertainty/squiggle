import { Prisma } from "@prisma/client";

import { prisma } from "@/prisma";

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
  cache: {
    select: {
      firstItem: true,
      secondItem: true,
      result: true,
      error: true,
    },
  },
  definition: {
    select: {
      owner: { select: { slug: true } },
      slug: true,
    },
  },
} satisfies Prisma.RelativeValuesExportSelect;

export type RelativeValuesExportFullDTO = {
  id: string;
  variableName: string;
  modelRevision: {
    model: {
      slug: string;
      isPrivate: boolean;
      owner: { slug: string };
    };
  };
  cache: {
    firstItem: string;
    secondItem: string;
    resultJSON: string;
    errorString: string | null;
  }[];
  definition: {
    owner: string;
    slug: string;
  };
};

function toDTO(
  row: Prisma.RelativeValuesExportGetPayload<{
    select: typeof select;
  }>
): RelativeValuesExportFullDTO {
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
    cache: row.cache.map((c) => ({
      firstItem: c.firstItem,
      secondItem: c.secondItem,
      resultJSON: JSON.stringify(c.result),
      errorString: c.error,
    })),
    definition: {
      owner: row.definition.owner.slug,
      slug: row.definition.slug,
    },
  };
}

export async function loadRelativeValuesExportFullFromModelRevision(params: {
  modelRevisionId: string;
  variableName: string;
}): Promise<RelativeValuesExportFullDTO | null> {
  const exports = await prisma.relativeValuesExport.findMany({
    where: {
      modelRevisionId: params.modelRevisionId,
      variableName: params.variableName,
    },
    select,
  });

  if (exports.length > 1) {
    throw new Error("Ambiguous input, multiple variables match it");
  }

  if (exports.length === 0) {
    return null;
  }

  return toDTO(exports[0]);
}
