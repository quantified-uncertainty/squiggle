import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { Searchable } from "../types/Searchable";
import { Searchable as PrismaSearchable } from "@prisma/client";
import { resolveOffsetConnection } from "@pothos/plugin-relay";

type SearchableWithEdgeData = PrismaSearchable & {
  rank: number;
  slugSnippet: string;
  textSnippet: string;
};

const SearchEdge = builder.edgeObject({
  type: Searchable,
  name: "SearchEdge",
  fields: (t) => ({
    rank: t.float({
      resolve: (obj) => {
        const rank = (obj.node as SearchableWithEdgeData).rank;
        return rank ?? 1e9;
      },
    }),
    slugSnippet: t.string({
      resolve: (obj) => {
        const snippet = (obj.node as SearchableWithEdgeData).slugSnippet;
        return String(snippet ?? "");
      },
    }),
    textSnippet: t.string({
      resolve: (obj) => {
        const snippet = (obj.node as SearchableWithEdgeData).textSnippet;
        return String(snippet ?? "");
      },
    }),
  }),
});

builder.queryField("search", (t) =>
  t.connection(
    {
      type: Searchable,
      args: {
        text: t.arg.string({ required: true }),
      },
      errors: {},
      resolve: async (_, args, { session }) => {
        return await resolveOffsetConnection(
          { args },
          async ({ limit, offset }) => {
            const { text } = args;
            return await prisma.$queryRaw<SearchableWithEdgeData[]>`
        SELECT
          "Searchable".*,
          -- ranking function
          ts_rank_cd(
            setweight(to_tsvector(coalesce("Model".slug, '')), 'A') ||
            setweight(to_tsvector(coalesce("SquiggleSnippet".code, '')), 'B') ||
            setweight(to_tsvector(coalesce("RelativeValuesDefinition".slug, '')), 'A') ||
            setweight(to_tsvector(coalesce("UserOwner".slug, '')), 'A') ||
            setweight(to_tsvector(coalesce("GroupOwner".slug, '')), 'A'),
            websearch_to_tsquery(${text})
          ) AS rank,
          ts_headline(
            concat_ws(
              ' ',
              "Model".slug,
              "RelativeValuesDefinition".slug,
              "UserOwner".slug,
              "GroupOwner".slug
            ),
            websearch_to_tsquery(${text}),
            'HighlightAll=t'
          ) AS "slugSnippet",
          ts_headline(concat_ws(
              ' ',
              "SquiggleSnippet".code
            ), websearch_to_tsquery(${text})
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
            )) @@ websearch_to_tsquery(${text})
          )
        ORDER BY rank DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
          }
        );
      },
    },
    {},
    SearchEdge
  )
);
