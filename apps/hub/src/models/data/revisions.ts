import { Prisma } from "@quri/hub-db";

import { findPaginated, makePaginated } from "@/lib/server/dataHelpers";
import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";

import { modelWhereCanRead } from "../authHelpers";
import {
  ModelRevisionBuildDTO,
  modelRevisionBuildToDTO,
  selectModelRevisionBuild,
} from "./builds";

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
    select: selectModelRevisionBuild,
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

type ModelRevisionRow = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.modelRevision.findFirst<{
        select: typeof selectModelRevision;
      }>
    >
  >
>;

export type ModelRevisionDTO = {
  id: string;
  createdAt: Date;
  author?: { username: string };
  comment?: string;
  variableRevisions: { id: string }[];
  buildStatus: BuildStatus;
  lastBuild?: ModelRevisionBuildDTO;
};

export function modelRevisionToDTO(row: ModelRevisionRow): ModelRevisionDTO {
  const lastBuild = row.builds.at(0);
  let buildStatus: BuildStatus = "Pending";
  if (lastBuild) {
    const errors = lastBuild.errors.filter((e) => e !== "");
    buildStatus = errors.length === 0 ? "Success" : "Failure";
  } else if (row.model.currentRevisionId !== row.id) {
    buildStatus = "Skipped";
  }

  return {
    id: row.id,
    createdAt: row.createdAt,
    author: row.author?.asOwner
      ? {
          username: row.author.asOwner?.slug,
        }
      : undefined,
    comment: row.comment,
    variableRevisions: row.variableRevisions,
    buildStatus,
    lastBuild: lastBuild ? modelRevisionBuildToDTO(lastBuild) : undefined,
  };
}

export async function loadModelRevisions({
  limit = 20,
  cursor,
  ...params
}: {
  limit?: number;
  cursor?: string;
  owner: string;
  slug: string;
}): Promise<Paginated<ModelRevisionDTO>> {
  const rows = await prisma.modelRevision.findMany({
    select: selectModelRevision,
    where: {
      model: await modelWhereCanRead({
        slug: params.slug,
        owner: { slug: params.owner },
      }),
    },
    orderBy: { createdAt: "desc" },
    ...findPaginated(cursor, limit),
  });

  const revisions = rows.map(modelRevisionToDTO);

  const nextCursor = rows[rows.length - 1]?.id;
  async function loadMore(limit: number) {
    "use server";
    return loadModelRevisions({ ...params, cursor: nextCursor, limit });
  }

  return makePaginated(revisions, limit, loadMore);
}
