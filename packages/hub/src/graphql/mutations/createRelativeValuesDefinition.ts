import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { InputObjectRef } from "@pothos/core";
import { RelativeValuesDefinition } from "../types/RelativeValuesDefinition";

export const validateItemId = { regex: /^\w[\w\-]*$/ };
const validateColor = { regex: /^#[0-9a-f]{6}$/ };

export const RelativeValuesClusterInput = builder.inputType(
  "RelativeValuesClusterInput",
  {
    fields: (t) => ({
      id: t.string({
        required: true,
        validate: validateItemId,
      }),
      color: t.string({
        required: true,
        validate: validateColor,
      }),
      recommendedUnit: t.string({
        validate: validateItemId,
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
        validate: validateItemId,
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
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("CreateRelativeValuesDefinitionResult", {
      fields: (t) => ({
        definition: t.field({
          type: RelativeValuesDefinition,
          nullable: false,
        }),
      }),
    }),
    errors: {},
    input: {
      // TODO - extract to helper module
      slug: t.input.string({
        required: true,
        validate: { regex: /^\w[\w\-]*$/ },
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
        validate: validateItemId,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      validateRelativeValuesDefinition({
        items: input.items,
        clusters: input.clusters,
        recommendedUnit: input.recommendedUnit,
      });

      const definition = await prisma.relativeValuesDefinition.create({
        data: {
          owner: {
            connect: { email: session.user.email },
          },
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
      });

      return { definition };
    },
  })
);
