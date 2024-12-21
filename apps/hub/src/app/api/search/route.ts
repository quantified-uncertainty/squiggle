import { Searchable as PrismaSearchable } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import {
  groupRoute,
  modelRoute,
  relativeValuesRoute,
  userRoute,
} from "@/lib/routes";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

import { SearchResult } from "./schema";

type SearchableWithEdgeData = PrismaSearchable & {
  rank: number;
  slugSnippet: string;
  textSnippet: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const { query } = z
    .object({
      query: z.string(),
    })
    .parse(Object.fromEntries(searchParams.entries()));

  const limit = 20;
  const offset = 0;

  const session = await auth();

  const rows = await prisma.$queryRaw<SearchableWithEdgeData[]>`
        SELECT
          "Searchable".*,
          -- ranking function
          ts_rank_cd(
            setweight(to_tsvector(coalesce("Model".slug, '')), 'A') ||
            setweight(to_tsvector(coalesce("SquiggleSnippet".code, '')), 'B') ||
            setweight(to_tsvector(coalesce("RelativeValuesDefinition".slug, '')), 'A') ||
            setweight(to_tsvector(coalesce("UserOwner".slug, '')), 'A') ||
            setweight(to_tsvector(coalesce("GroupOwner".slug, '')), 'A'),
            websearch_to_tsquery(${query})
          ) AS rank,
          ts_headline(
            concat_ws(
              ' ',
              "Model".slug,
              "RelativeValuesDefinition".slug,
              "UserOwner".slug,
              "GroupOwner".slug
            ),
            websearch_to_tsquery(${query}),
            'HighlightAll=t'
          ) AS "slugSnippet",
          ts_headline(concat_ws(
              ' ',
              "SquiggleSnippet".code
            ), websearch_to_tsquery(${query})
          ) AS "textSnippet"
        FROM "Searchable"
        LEFT JOIN "Model" ON "Model".id = "Searchable"."modelId"
          LEFT JOIN "Owner" AS "ModelOwner" ON "Model"."ownerId" = "ModelOwner".id
            LEFT JOIN "User" AS "ModelOwnerUser" ON "ModelOwner".id = "ModelOwnerUser"."ownerId"
            LEFT JOIN "Group" AS "ModelOwnerGroup" ON "ModelOwner".id = "ModelOwnerGroup"."ownerId"
          LEFT JOIN "ModelRevision" ON "Model"."currentRevisionId" = "ModelRevision".id
            LEFT JOIN "SquiggleSnippet" ON "ModelRevision"."contentId" = "SquiggleSnippet".id
        LEFT JOIN "RelativeValuesDefinition" ON "RelativeValuesDefinition".id = "Searchable"."definitionId"
          -- LEFT JOIN "Owner" AS "RelativeValuesDefinitionOwner" ON "RelativeValuesDefinition"."ownerId" = "RelativeValuesDefinitionOwner".id
        LEFT JOIN "User" ON "User".id = "Searchable"."userId"
          LEFT JOIN "Owner" AS "UserOwner" ON "User"."ownerId" = "UserOwner".id
        LEFT JOIN "Group" ON "Group".id = "Searchable"."groupId"
          LEFT JOIN "Owner" AS "GroupOwner" ON "Group"."ownerId" = "GroupOwner".id
        WHERE
          (
            -- check permissions, should match "modelWhereHasAccess" function
            "Model".id IS NULL OR
            "Model"."isPrivate" IS FALSE
            OR "ModelOwnerUser".email = ${session?.user.email}
            OR "ModelOwnerGroup".id IN (
              SELECT DISTINCT "groupId"
              FROM "UserGroupMembership"
              LEFT JOIN "User" ON "User".id = "UserGroupMembership"."userId"
              WHERE "User".email = ${session?.user.email}
            )
          ) AND (
            -- construct search document
            to_tsvector(concat_ws(
              ' ',
              "Model".slug,
              "SquiggleSnippet".code,
              "RelativeValuesDefinition".slug,
              "UserOwner".slug,
              "GroupOwner".slug
            )) @@ websearch_to_tsquery(${query})
          )
        ORDER BY rank DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

  const modelIds = rows
    .filter(
      (row): row is SearchableWithEdgeData & { modelId: string } =>
        row.modelId !== null
    )
    .map((row) => row.modelId);

  const definitionIds = rows
    .filter(
      (row): row is SearchableWithEdgeData & { definitionId: string } =>
        row.definitionId !== null
    )
    .map((row) => row.definitionId);

  const userIds = rows
    .filter(
      (row): row is SearchableWithEdgeData & { userId: string } =>
        row.userId !== null
    )
    .map((row) => row.userId);

  const groupIds = rows
    .filter(
      (row): row is SearchableWithEdgeData & { groupId: string } =>
        row.groupId !== null
    )
    .map((row) => row.groupId);

  const models = modelIds.length
    ? await prisma.model.findMany({
        where: {
          id: { in: modelIds },
        },
        select: {
          id: true,
          slug: true,
          owner: {
            select: {
              slug: true,
            },
          },
        },
      })
    : [];

  const definitions = definitionIds.length
    ? await prisma.relativeValuesDefinition.findMany({
        where: {
          id: { in: definitionIds },
        },
        select: {
          id: true,
          slug: true,
          owner: {
            select: {
              slug: true,
            },
          },
        },
      })
    : [];

  const users = userIds.length
    ? await prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          asOwner: {
            select: {
              slug: true,
            },
          },
        },
      })
    : [];

  const groups = groupIds.length
    ? await prisma.group.findMany({
        where: {
          id: { in: groupIds },
        },
        select: {
          id: true,
          asOwner: {
            select: {
              slug: true,
            },
          },
        },
      })
    : [];

  const result: SearchResult = [];

  for (const row of rows) {
    if (row.modelId !== null) {
      const model = models.find((m) => m.id === row.modelId);
      if (!model) continue;

      result.push({
        id: row.id,
        link: modelRoute({ owner: model.owner.slug, slug: model.slug }),
        slugSnippet: row.slugSnippet,
        textSnippet: row.textSnippet,
        object: { type: "Model", owner: model.owner.slug, slug: model.slug },
      });
    } else if (row.definitionId !== null) {
      const definition = definitions.find((d) => d.id === row.definitionId);
      if (!definition) continue;

      result.push({
        id: row.id,
        link: relativeValuesRoute({
          owner: definition.owner.slug,
          slug: definition.slug,
        }),
        slugSnippet: row.slugSnippet,
        textSnippet: row.textSnippet,
        object: {
          type: "RelativeValuesDefinition",
          owner: definition.owner.slug,
          slug: definition.slug,
        },
      });
    } else if (row.userId !== null) {
      const user = users.find((u) => u.id === row.userId);
      if (!user?.asOwner) continue;

      const username = user.asOwner.slug;

      result.push({
        id: row.id,
        link: userRoute({ username }),
        slugSnippet: row.slugSnippet,
        textSnippet: row.textSnippet,
        object: { type: "User", slug: username },
      });
    } else if (row.groupId !== null) {
      const group = groups.find((g) => g.id === row.groupId);
      if (!group?.asOwner) continue;

      const slug = group.asOwner.slug;

      result.push({
        id: row.id,
        link: groupRoute({ slug }),
        slugSnippet: row.slugSnippet,
        textSnippet: row.textSnippet,
        object: { type: "Group", slug },
      });
    }
  }

  return Response.json(result);
}
