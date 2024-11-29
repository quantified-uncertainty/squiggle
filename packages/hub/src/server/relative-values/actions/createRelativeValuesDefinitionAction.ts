"use server";

import { prisma } from "@/prisma";
import { getWriteableOwnerBySlug } from "@/server/owners/auth";
import { indexDefinitionId } from "@/server/search/helpers";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction, rethrowOnConstraint } from "@/server/utils";

import { inputSchema, validateRelativeValuesDefinition } from "./common";

export const createRelativeValuesDefinitionAction = makeServerAction(
  inputSchema,
  async (
    input
  ): Promise<{
    owner: string;
    slug: string;
  }> => {
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

    await indexDefinitionId(definition.id);

    return {
      owner: definition.owner.slug,
      slug: definition.slug,
    };
  }
);
