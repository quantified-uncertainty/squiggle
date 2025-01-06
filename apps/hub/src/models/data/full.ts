import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/server/prisma";
import { controlsOwnerId } from "@/owners/data/auth";

import { modelWhereHasAccess } from "./authHelpers";
import {
  ModelRevisionFullDTO,
  modelRevisionFullToDTO,
  selectModelRevisionFull,
} from "./fullRevision";

const select = {
  id: true,
  slug: true,
  isPrivate: true,
  owner: {
    select: {
      id: true,
      slug: true,
    },
  },
  currentRevision: {
    select: selectModelRevisionFull,
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
  currentRevision: ModelRevisionFullDTO;
  isPrivate: boolean;
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
    currentRevision: await modelRevisionFullToDTO(row.currentRevision),
    isEditable: await controlsOwnerId(row.owner.id),
    isPrivate: row.isPrivate,
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
