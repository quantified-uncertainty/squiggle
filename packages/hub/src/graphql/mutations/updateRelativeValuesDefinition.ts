import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { RelativeValuesDefinition } from "../types/RelativeValuesDefinition";

import {
  RelativeValuesClusterInput,
  RelativeValuesItemInput,
  validateItemId,
  validateRelativeValuesDefinition,
} from "./createRelativeValuesDefinition";

builder.mutationField("updateRelativeValuesDefinition", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("UpdateRelativeValuesDefinitionResult", {
      fields: (t) => ({
        definition: t.field({
          type: RelativeValuesDefinition,
          nullable: false,
        }),
      }),
    }),
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
      recommendedUnit: t.input.string({
        validate: validateItemId,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      if (session.user.username !== input.username) {
        throw new Error("Can't edit another user's model");
      }

      const owner = await prisma.user.findUniqueOrThrow({
        where: {
          username: input.username,
        },
      });

      validateRelativeValuesDefinition({
        items: input.items,
        clusters: input.clusters,
        recommendedUnit: input.recommendedUnit,
      });

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
