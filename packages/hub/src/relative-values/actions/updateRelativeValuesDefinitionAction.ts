"use server";
import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { getWriteableOwnerBySlug } from "@/owners/data/auth";
import { getSessionOrRedirect } from "@/users/auth";

import { inputSchema, validateRelativeValuesDefinition } from "./common";

export const updateRelativeValuesDefinitionAction = actionClient
  .schema(inputSchema)
  .action(
    async ({
      parsedInput: input,
    }): Promise<{ owner: string; slug: string }> => {
      const session = await getSessionOrRedirect();
      const ownerSlug = input.owner ?? session.user.username;
      if (!ownerSlug) {
        throw new Error("Owner slug or username is required");
      }
      const owner = await getWriteableOwnerBySlug(session, ownerSlug);

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
          select: {
            owner: {
              select: {
                slug: true,
              },
            },
            slug: true,
          },
        });

        return definition;
      });

      return { owner: definition.owner.slug, slug: definition.slug };
    }
  );
