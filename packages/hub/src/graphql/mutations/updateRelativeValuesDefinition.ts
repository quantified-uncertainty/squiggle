import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { RelativeValuesDefinition } from "../types/RelativeValuesDefinition";

import {
  RelativeValuesClusterInput,
  RelativeValuesItemInput,
} from "./createRelativeValuesDefinition";

builder.mutationField("updateRelativeValuesDefinition", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("UpdateRelativeValuesDefinitionResult", {
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
      username: t.input.string({ required: true }),
      slug: t.input.string({ required: true }),
      title: t.input.string({ required: true }),
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
      if (session?.user.username !== input.username) {
        throw new Error("Can't edit another user's model");
      }

      const owner = await prisma.user.findUniqueOrThrow({
        where: {
          username: input.username,
        },
      });

      if (!input.items.length) {
        throw new Error("Definition must include at least one item");
      }

      // TODO - there's some copy-paste here from createRelativeValuesDefinition

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

      const revision = await prisma.relativeValuesDefinitionRevision.create({
        data: {
          title: input.title,
          items: input.items,
          clusters: input.clusters,
          definition: {
            connect: {
              slug_ownerId: {
                slug: input.slug,
                ownerId: owner.id,
              },
            },
          },
        },
        select: {
          definition: true,
        },
      });

      return { definition: revision.definition };
    },
  })
);
