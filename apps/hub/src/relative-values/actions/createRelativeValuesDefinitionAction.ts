"use server";

import {
  actionClient,
  failValidationOnConstraint,
} from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { getWriteableOwnerOrSelf } from "@/owners/data/auth";
import { indexDefinitionId } from "@/search/helpers";

import { inputSchema, validateRelativeValuesDefinition } from "./common";

export const createRelativeValuesDefinitionAction = actionClient
  .schema(inputSchema)
  .action(
    async ({
      parsedInput: input,
    }): Promise<{
      owner: string;
      slug: string;
    }> => {
      const owner = await getWriteableOwnerOrSelf(input.owner);

      validateRelativeValuesDefinition({
        items: input.items,
        clusters: input.clusters,
        recommendedUnit: input.recommendedUnit,
      });

      const definition = await prisma.$transaction(async (tx) => {
        const definition = await failValidationOnConstraint(
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
              select: {
                id: true,
                slug: true,
                owner: {
                  select: {
                    slug: true,
                  },
                },
              },
            }),
          {
            schema: inputSchema,
            handlers: [
              {
                constraint: ["slug", "ownerId"],
                input: "slug",
                error: `The definition ${input.slug} already exists on this account`,
              },
            ],
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

      await indexDefinitionId(definition.id);

      return {
        owner: definition.owner.slug,
        slug: definition.slug,
      };
    }
  );
