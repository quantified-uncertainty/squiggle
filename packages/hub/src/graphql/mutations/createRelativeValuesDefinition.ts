import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { InputObjectRef } from "@pothos/core";
import { rethrowOnConstraint } from "../errors/common";
import { getWriteableOwner, getWriteableOwnerBySlug } from "../types/Owner";
import { RelativeValuesDefinition } from "../types/RelativeValuesDefinition";
import { validateSlug } from "../utils";
import { ZodError } from "zod";

const validateColor = { regex: /^#[0-9a-fA-F]{6}$/ };

export const RelativeValuesClusterInput = builder.inputType(
  "RelativeValuesClusterInput",
  {
    fields: (t) => ({
      id: t.string({
        required: true,
        validate: validateSlug,
      }),
      color: t.string({
        required: true,
        validate: validateColor,
      }),
      recommendedUnit: t.string({
        validate: validateSlug,
      }),
    }),
  }
);

export const RelativeValuesItemInput = builder.inputType(
  "RelativeValuesItemInput",
  {
    fields: (t) => ({
      id: t.string({
        required: true,
        validate: validateSlug,
      }),
      name: t.string({
        required: true,
      }),
      description: t.string(),
      clusterId: t.string(),
    }),
  }
);

type ExtractInputShape<Type> = Type extends InputObjectRef<infer T> ? T : never;

export function validateRelativeValuesDefinition({
  items,
  clusters,
  recommendedUnit,
}: {
  items: ExtractInputShape<typeof RelativeValuesItemInput>[];
  clusters: ExtractInputShape<typeof RelativeValuesClusterInput>[];
  recommendedUnit: string | null | undefined;
}) {
  if (!items.length) {
    throw new Error("RelativeValuesDefinition must include at least one item");
  }

  const itemIds = new Set<string>();
  for (const item of items) {
    if (itemIds.has(item.id)) {
      throw new Error(`Duplicate item id ${item.id}`);
    }
    if (!item.id.match(/^\w[\w\-]*$/)) {
      throw new Error(`Invalid item id ${item.id}`);
    }
    itemIds.add(item.id);
  }

  const checkId = (id: string | null | undefined) => {
    if (id !== null && id !== undefined && !itemIds.has(id)) {
      throw new Error(`id ${id} not found in items`);
    }
  };

  for (const cluster of clusters) {
    checkId(cluster.recommendedUnit);
  }
  checkId(recommendedUnit);
}

builder.mutationField("createRelativeValuesDefinition", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("CreateRelativeValuesDefinitionResult", {
      fields: (t) => ({
        definition: t.field({ type: RelativeValuesDefinition }),
      }),
    }),
    errors: { types: [ZodError] },
    input: {
      groupSlug: t.input.string({
        validate: validateSlug,
        description:
          "Optional, if not set, definition will be created on current user's account",
      }),
      slug: t.input.string({
        required: true,
        validate: validateSlug,
      }),
      title: t.input.string({ required: true }),
      items: t.input.field({
        type: [RelativeValuesItemInput],
        required: true,
      }),
      clusters: t.input.field({
        type: [RelativeValuesClusterInput],
        required: true,
      }),
      recommendedUnit: t.input.string({
        validate: validateSlug,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const owner = await getWriteableOwner(session, input.groupSlug);

      validateRelativeValuesDefinition({
        items: input.items,
        clusters: input.clusters,
        recommendedUnit: input.recommendedUnit,
      });

      const definition = await prisma.$transaction(async (tx) => {
        const definition = await rethrowOnConstraint(
          () =>
            tx.relativeValuesDefinition.create({
              data: {
                ownerId: owner.id,
                slug: input.slug,
                revisions: {
                  create: {
                    title: input.title,
                    items: input.items,
                    clusters: input.clusters,
                    recommendedUnit: input.recommendedUnit,
                  },
                },
              },
            }),
          {
            target: ["slug", "ownerId"],
            error: `The definition ${input.slug} already exists on this account`,
          }
        );

        const revision = await tx.relativeValuesDefinitionRevision.create({
          data: {
            title: input.title,
            items: input.items,
            clusters: input.clusters,
            recommendedUnit: input.recommendedUnit,
            definition: {
              connect: {
                id: definition.id,
              },
            },
          },
        });

        await tx.relativeValuesDefinition.update({
          where: {
            id: definition.id,
          },
          data: {
            currentRevisionId: revision.id,
          },
        });

        return definition;
      });

      return { definition };
    },
  })
);
