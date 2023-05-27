import { builder } from "@/graphql/builder";
import { RelativeValuesDefinition } from "../types/definition";
import { prisma } from "@/prisma";

export const RelativeValuesClusterInput = builder.inputType(
  "RelativeValuesClusterInput",
  {
    fields: (t) => ({
      id: t.string({
        required: true,
        validate: {
          regex: /^\w[\w\-]*$/,
        },
      }),
      color: t.string({
        required: true,
        validate: {
          regex: /^#[0-9a-f]{6}$/,
        },
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
        validate: {
          regex: /^\w[\w\-]*$/,
        },
      }),
      name: t.string({
        required: true,
      }),
      description: t.string(),
      clusterId: t.string(),
      recommendedUnit: t.string({
        validate: {
          regex: /^\w[\w\-]*$/,
        },
      }),
    }),
  }
);

builder.mutationField("createRelativeValuesDefinition", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("CreateRelativeValuesDefinitionResult", {
      fields: (t) => ({
        definition: t.field({
          type: RelativeValuesDefinition,
          nullable: false,
        }),
      }),
    }),
    authScopes: {
      user: true,
    },
    errors: {},
    input: {
      // TODO - extract to helper module
      slug: t.input.string({
        required: true,
        validate: {
          regex: /^\w[\w\-]*$/,
        },
      }),
      title: t.input.string({
        required: true,
      }),
      items: t.input.field({
        type: [RelativeValuesItemInput],
        required: true,
      }),
      clusters: t.input.field({
        type: [RelativeValuesClusterInput],
        required: true,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const email = session?.user.email;
      if (!email) {
        // shouldn't happen because we checked user auth scope previously, but helps with type checks
        throw new Error("Email is missing");
      }

      if (!input.items.length) {
        throw new Error(
          "RelativeValuesDefinition must include at least one item"
        );
      }

      const itemIds = new Set<string>();
      for (const item of input.items) {
        if (itemIds.has(item.id)) {
          throw new Error(`Duplicate item id ${item.id}`);
        }
        if (!item.id.match(/^\w[\w\-]*$/)) {
          throw new Error(`Invalid item id ${item.id}`);
        }
        itemIds.add(item.id);
      }

      // TODO - check that `recommendedUnit` matches some item id, and that `clusterId` matches some cluster id

      const definition = await prisma.relativeValuesDefinition.create({
        data: {
          owner: {
            connect: { email },
          },
          slug: input.slug,
          revisions: {
            create: {
              title: input.title,
              items: input.items,
              clusters: input.clusters,
            },
          },
        },
      });

      return { definition };
    },
  })
);
