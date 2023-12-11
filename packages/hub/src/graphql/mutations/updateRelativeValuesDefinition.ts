import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { getWriteableOwnerBySlug } from "../helpers/ownerHelpers";
import { RelativeValuesDefinition } from "../types/RelativeValuesDefinition";
import { validateSlug } from "../utils";
import {
  RelativeValuesClusterInput,
  RelativeValuesItemInput,
  validateRelativeValuesDefinition,
} from "./createRelativeValuesDefinition";

builder.mutationField("updateRelativeValuesDefinition", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
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
      owner: t.input.string({ required: true }),
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
        validate: validateSlug,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const owner = await getWriteableOwnerBySlug(session, input.owner);

      validateRelativeValuesDefinition({
        items: input.items,
        clusters: input.clusters,
        recommendedUnit: input.recommendedUnit,
      });

      const definition = await prisma.$transaction(async (tx) => {
        const revision = await tx.relativeValuesDefinitionRevision.create({
          data: {
            title: input.title,
            items: input.items,
            clusters: input.clusters,
            recommendedUnit: input.recommendedUnit,
            definition: {
              connect: {
                slug_ownerId: {
                  slug: input.slug,
                  ownerId: owner.id,
                },
              },
            },
          },
          include: {
            definition: {
              select: {
                id: true,
              },
            },
          },
        });

        const definition = await tx.relativeValuesDefinition.update({
          where: {
            id: revision.definition.id,
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
