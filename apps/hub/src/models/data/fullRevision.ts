import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/server/prisma";

import { modelWhereHasAccess } from "./authHelpers";

export const selectModelRevisionFull = {
  id: true,
  createdAt: true,
  comment: true,
  contentType: true,
  squiggleSnippet: {
    select: {
      id: true,
      code: true,
      version: true,
      seed: true,
      autorunMode: true,
      sampleCount: true,
      xyPointLength: true,
    },
  },
  relativeValuesExports: {
    select: {
      variableName: true,
      definition: {
        select: {
          slug: true,
          owner: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ModelRevisionSelect;

type Row = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.modelRevision.findFirst<{
        select: typeof selectModelRevisionFull;
      }>
    >
  >
>;

export type ModelRevisionFullDTO = {
  id: string;
  createdAt: Date;
  comment: string;
  contentType: "SquiggleSnippet";
  squiggleSnippet: {
    id: string;
    code: string;
    version: string;
    seed: string;
    autorunMode: boolean | null;
    sampleCount: number | null;
    xyPointLength: number | null;
  };
  relativeValuesExports: {
    variableName: string;
    definition: {
      slug: string;
      owner: { slug: string };
    };
  }[];
};

export async function modelRevisionFullToDTO(
  row: Row
): Promise<ModelRevisionFullDTO> {
  // FIXME - validate
  if (!row.squiggleSnippet) {
    throw new Error("Unknown model type");
  }
  return row as typeof row & { squiggleSnippet: typeof row.squiggleSnippet };
}

export async function loadModelRevisionFull({
  owner,
  slug,
  revisionId,
}: {
  owner: string;
  slug: string;
  revisionId: string;
}): Promise<ModelRevisionFullDTO | null> {
  const dbRevision = await prisma.modelRevision.findFirst({
    where: {
      id: revisionId,
      model: {
        slug,
        owner: { slug: owner },
        OR: await modelWhereHasAccess(),
      },
    },
    select: selectModelRevisionFull,
  });

  if (!dbRevision) {
    return null;
  }

  return modelRevisionFullToDTO(dbRevision);
}