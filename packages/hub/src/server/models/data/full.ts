import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/prisma";
import { controlsOwnerId } from "@/server/owners/auth";

import { modelWhereHasAccess } from "./authHelpers";

const select = {
  id: true,
  slug: true,
  owner: {
    select: {
      id: true,
      slug: true,
    },
  },
  currentRevision: {
    select: {
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
    },
  },
} satisfies Prisma.ModelSelect;

type Row = NonNullable<
  Awaited<ReturnType<typeof prisma.model.findFirst<{ select: typeof select }>>>
>;

export type ModelFullDTO = {
  id: string;
  slug: string;
  owner: {
    id: string;
    slug: string;
  };
  currentRevision: {
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
        owner: {
          slug: string;
        };
      };
    }[];
  };
  isEditable: boolean;
  lastBuildSeconds: number | null;
};

async function toDTO(row: Row): Promise<ModelFullDTO> {
  if (!row.currentRevision) {
    throw new Error("No current revision");
  }

  if (!row.currentRevision.squiggleSnippet) {
    throw new Error("No squiggle snippet");
  }

  let lastBuildSeconds: number | null = null;
  {
    const lastRevisionWithBuild = await prisma.modelRevision.findFirst({
      select: {
        builds: {
          select: {
            runSeconds: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      where: {
        modelId: row.id,
        builds: {
          some: {
            id: {
              not: undefined,
            },
          },
        },
      },
    });
    if (lastRevisionWithBuild) {
      lastBuildSeconds = lastRevisionWithBuild.builds[0]?.runSeconds;
    }
  }

  return {
    id: row.id,
    slug: row.slug,
    owner: {
      id: row.owner.id,
      slug: row.owner.slug,
    },
    currentRevision: {
      contentType: row.currentRevision.contentType,
      squiggleSnippet: row.currentRevision.squiggleSnippet,
      relativeValuesExports: row.currentRevision.relativeValuesExports,
    },
    isEditable: await controlsOwnerId(row.owner.id),
    lastBuildSeconds,
  };
}

export async function loadModelFull({
  owner,
  slug,
}: {
  owner: string;
  slug: string;
}): Promise<ModelFullDTO | null> {
  const row = await prisma.model.findFirst({
    select,
    where: {
      slug: slug,
      owner: { slug: owner },
      OR: await modelWhereHasAccess(),
    },
  });

  if (!row) {
    return null;
  }

  return toDTO(row);
}
