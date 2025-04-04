"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { RelativeValuesDefinition } from "@quri/hub-db";
import { squiggleVersions } from "@quri/versioned-squiggle-components";

import { modelRoute } from "@/lib/routes";
import { actionClient, ActionError } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { zSlug } from "@/lib/zodUtils";
import { getSelf, getSessionOrRedirect } from "@/users/auth";

import { loadWriteableModel } from "../data/writeableModel";

export const updateSquiggleSnippetModelAction = actionClient
  .schema(
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
    })
  )
  .action(async ({ parsedInput: input }) => {
    const session = await getSessionOrRedirect();

    const existingModel = await loadWriteableModel({
      slug: input.slug,
      owner: input.owner,
    });

    const version = input.content.version;
    if (!(squiggleVersions as readonly string[]).includes(version)) {
      throw new ActionError(`Unknown Squiggle version ${version}`);
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
          throw new ActionError(
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
      });

      return updatedModel;
    });

    revalidatePath(modelRoute({ owner: input.owner, slug: input.slug }));

    return { model };
  });
