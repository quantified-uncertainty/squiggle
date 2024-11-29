"use server";
import { RelativeValuesDefinition } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { squiggleVersions } from "@quri/versioned-squiggle-components";

import { prisma } from "@/prisma";
import { modelRoute } from "@/routes";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction, zSlug } from "@/server/utils";

import { getWriteableModel } from "../../../graphql/helpers/modelHelpers";
import { getSelf } from "../../../graphql/helpers/userHelpers";

export const updateSquiggleSnippetModelAction = makeServerAction(
  z.object({
    owner: zSlug,
    slug: zSlug,
    relativeValuesExports: z.array(
      z.object({
        variableName: z.string(),
        definition: z.object({
          owner: zSlug,
          slug: zSlug,
        }),
      })
    ),
    content: z.object({
      code: z.string(),
      version: z.string(),
      seed: z.string(),
      autorunMode: z.boolean().nullable(),
      sampleCount: z.number().nullable(),
      xyPointLength: z.number().nullable(),
    }),
    comment: z.string().optional(),
  }),
  async (input) => {
    const session = await getSessionOrRedirect();
    const existingModel = await getWriteableModel({
      slug: input.slug,
      session,
      owner: input.owner,
    });

    const version = input.content.version;
    if (!(squiggleVersions as readonly string[]).includes(version)) {
      throw new Error(`Unknown Squiggle version ${version}`);
    }

    const relativeValuesExports = input.relativeValuesExports ?? [];

    const relativeValuesExportsToInsert: {
      definitionId: string;
      variableName: string;
    }[] = [];

    if (relativeValuesExports.length) {
      const selectedDefinitions =
        await prisma.relativeValuesDefinition.findMany({
          where: {
            OR: relativeValuesExports.map((pair) => ({
              slug: pair.definition.slug,
              owner: { slug: pair.definition.owner },
            })),
          },
          include: { owner: true },
        });

      // username -> slug -> Definition
      let linkedDefinitions: Map<
        string,
        Map<string, RelativeValuesDefinition>
      > = new Map();
      // now we need to match relativeValuesExports with definitions to get ids; I wonder if this could be simplified without sacrificing safety
      for (const definition of selectedDefinitions) {
        const { slug: ownerSlug } = definition.owner;
        if (ownerSlug === null) {
          continue; // should never happen
        }
        if (!linkedDefinitions.has(ownerSlug)) {
          linkedDefinitions.set(ownerSlug, new Map());
        }
        linkedDefinitions.get(ownerSlug)?.set(definition.slug, definition);
      }
      for (const pair of relativeValuesExports) {
        const definition = linkedDefinitions
          .get(pair.definition.owner)
          ?.get(pair.definition.slug);

        if (!definition) {
          throw new Error(
            `Definition with owner ${pair.definition.owner}, slug ${pair.definition.slug} not found`
          );
        }
        relativeValuesExportsToInsert.push({
          variableName: pair.variableName,
          definitionId: definition.id,
        });
      }
    }

    const self = await getSelf(session);

    const model = await prisma.$transaction(async (tx) => {
      const revision = await tx.modelRevision.create({
        data: {
          squiggleSnippet: {
            create: {
              code: input.content.code,
              version: input.content.version,
              seed: input.content.seed,
              autorunMode: input.content.autorunMode,
              sampleCount: input.content.sampleCount,
              xyPointLength: input.content.xyPointLength,
            },
          },
          contentType: "SquiggleSnippet",
          comment: input.comment ?? "",
          model: {
            connect: { id: existingModel.id },
          },
          author: {
            connect: { id: self.id },
          },
          relativeValuesExports: {
            createMany: {
              data: relativeValuesExportsToInsert,
            },
          },
        },
        include: {
          model: {
            select: {
              id: true,
            },
          },
        },
      });
      const updatedModel = await tx.model.update({
        where: {
          id: revision.modelId,
        },
        data: {
          currentRevisionId: revision.id,
        },
        // TODO - optimize with queryFromInfo, https://pothos-graphql.dev/docs/plugins/prisma#optimized-queries-without-tprismafield
      });

      return updatedModel;
    });

    revalidatePath(modelRoute({ owner: input.owner, slug: input.slug }));

    return { model };
  }
);
