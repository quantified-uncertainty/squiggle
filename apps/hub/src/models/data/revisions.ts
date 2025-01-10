import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";

import { modelWhereHasAccess } from "./authHelpers";

export const selectModelRevision = {
  id: true,
  createdAt: true,
  author: {
    select: { asOwner: { select: { slug: true } } },
  },
  comment: true,
  variableRevisions: {
    select: {
      id: true,
    },
  },
  // used for `buildStatus` and `lastBuild`
  builds: {
    select: {
      errors: true, // selected for `buildStatus`
      runSeconds: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  },
  model: {
    select: {
      currentRevisionId: true,
    },
  },
} satisfies Prisma.ModelRevisionSelect;

type BuildStatus = "Success" | "Failure" | "Pending" | "Skipped";

type DbModelRevision = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.modelRevision.findFirst<{
        select: typeof selectModelRevision;
      }>
    >
  >
>;

type DbModelRevisionBuild = DbModelRevision["builds"][number];

type ModelRevisionBuildDTO = {
  runSeconds: number;
  // no errors here - potential security risk, build script doesn't take `isPrivate` into account
};

export type ModelRevisionDTO = {
  id: string;
  createdAt: Date;
  author?: { username: string };
  comment?: string;
  variableRevisions: { id: string }[];
  buildStatus: BuildStatus;
  lastBuild?: ModelRevisionBuildDTO;
};

function buildToDTO(build: DbModelRevisionBuild): ModelRevisionBuildDTO {
  return {
    runSeconds: build.runSeconds,
  };
}

export function modelRevisionToDTO(
  dbRevision: DbModelRevision
): ModelRevisionDTO {
  const lastBuild = dbRevision.builds[0];
  let buildStatus: BuildStatus = "Pending";
  if (lastBuild) {
    const errors = lastBuild.errors.filter((e) => e !== "");
    buildStatus = errors.length === 0 ? "Success" : "Failure";
  } else if (dbRevision.model.currentRevisionId !== dbRevision.id) {
    buildStatus = "Skipped";
  }

  return {
    id: dbRevision.id,
    createdAt: dbRevision.createdAt,
    author: dbRevision.author?.asOwner
      ? {
          username: dbRevision.author.asOwner?.slug,
        }
      : undefined,
    comment: dbRevision.comment,
    variableRevisions: dbRevision.variableRevisions,
    buildStatus,
    lastBuild: lastBuild ? buildToDTO(lastBuild) : undefined,
  };
}

export async function loadModelRevisions(params: {
  owner: string;
  slug: string;
  cursor?: string;
  limit?: number;
}): Promise<Paginated<ModelRevisionDTO>> {
  const limit = params.limit ?? 20;

  const dbRevisions = await prisma.modelRevision.findMany({
    where: {
      model: {
        slug: params.slug,
        owner: { slug: params.owner },
        OR: await modelWhereHasAccess(),
      },
    },
    cursor: params.cursor ? { id: params.cursor } : undefined,
    orderBy: { createdAt: "desc" },
    select: selectModelRevision,
    take: limit + 1,
  });

  const nextCursor = dbRevisions[dbRevisions.length - 1]?.id;

  async function loadMore(limit: number) {
    "use server";
    return loadModelRevisions({ ...params, cursor: nextCursor, limit });
  }

  const revisions = dbRevisions.map(modelRevisionToDTO);

  return {
    items: revisions.slice(0, limit),
    loadMore: revisions.length > limit ? loadMore : undefined,
  };
}
