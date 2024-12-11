import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import {
  relativeValuesClustersSchema,
  relativeValuesItemsSchema,
} from "@/relative-values/types";

import {
  definitionCardSelect,
  RelativeValuesDefinitionCardDTO,
  toDefinitionCardDTO,
} from "./cards";

const select = {
  ...definitionCardSelect,
  currentRevision: {
    select: {
      id: true,
      title: true,
      items: true,
      clusters: true,
      recommendedUnit: true,
    },
  },
} satisfies Prisma.RelativeValuesDefinitionSelect;

type DbDefinitionFull = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.relativeValuesDefinition.findFirst<{
        select: typeof select;
      }>
    >
  >
>;

type NoUndefinedInObjectList<T extends any[]> = {
  [K in keyof T[number]]-?: Exclude<T[number][K], undefined>;
}[];

export type RelativeValuesDefinitionFullDTO =
  RelativeValuesDefinitionCardDTO & {
    currentRevision: {
      id: string;
      title: string;
      items: NoUndefinedInObjectList<z.infer<typeof relativeValuesItemsSchema>>;
      clusters: NoUndefinedInObjectList<
        z.infer<typeof relativeValuesClustersSchema>
      >;
      recommendedUnit: string | null;
    };
  };

function toDefinitionFullDTO(
  row: DbDefinitionFull
): RelativeValuesDefinitionFullDTO {
  if (!row.currentRevision) {
    // should never happen
    throw new Error("Current revision is required");
  }

  return {
    ...toDefinitionCardDTO(row),
    currentRevision: {
      id: row.currentRevision.id,
      title: row.currentRevision.title,
      items: relativeValuesItemsSchema
        .parse(row.currentRevision.items)
        .map((item) => ({
          ...item,
          clusterId: item.clusterId ?? null,
        })),
      clusters: relativeValuesClustersSchema
        .parse(row.currentRevision.clusters)
        .map((cluster) => ({
          ...cluster,
          recommendedUnit: cluster.recommendedUnit ?? null,
        })),
      recommendedUnit: row.currentRevision.recommendedUnit,
    },
  };
}

export async function loadRelativeValuesDefinitionFull(params: {
  owner: string;
  slug: string;
}): Promise<RelativeValuesDefinitionFullDTO | null> {
  const row = await prisma.relativeValuesDefinition.findFirst({
    where: {
      owner: { slug: params.owner },
      slug: params.slug,
    },
    select,
  });
  if (!row) {
    return null;
  }
  return toDefinitionFullDTO(row);
}
