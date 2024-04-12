import { RelativeValuesDefinition } from "@prisma/client";

import { squiggleVersions } from "@quri/versioned-squiggle-components";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { getWriteableModel } from "../helpers/modelHelpers";
import { getSelf } from "../helpers/userHelpers";
import { Model } from "../types/Model";
import { getExportedVariableNames } from "../types/ModelRevision";

const DefinitionRefInput = builder.inputType("DefinitionRefInput", {
  fields: (t) => ({
    owner: t.string({ required: true }),
    slug: t.string({ required: true }),
  }),
});

const RelativeValuesExportInput = builder.inputType(
  "RelativeValuesExportInput",
  {
    fields: (t) => ({
      variableName: t.string({ required: true }),
      definition: t.field({
        type: DefinitionRefInput,
        required: true,
      }),
    }),
  }
);

const SquiggleSnippetContentInput = builder.inputType(
  "SquiggleSnippetContentInput",
  {
    fields: (t) => ({
      code: t.string({ required: true }),
      version: t.string({ required: true }),
      seed: t.string({ required: true }),
      autorunMode: t.boolean({ required: false }),
      sampleCount: t.int({ required: false }),
      xyPointLength: t.int({ required: false }),
    }),
  }
);

builder.mutationField("updateSquiggleSnippetModel", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("UpdateSquiggleSnippetResult", {
      fields: (t) => ({
        model: t.field({ type: Model }),
      }),
    }),
    errors: {},
    input: {
      owner: t.input.string({ required: true }),
      slug: t.input.string({ required: true }),
      relativeValuesExports: t.input.field({
        type: [RelativeValuesExportInput],
      }),
      content: t.input.field({
        type: SquiggleSnippetContentInput,
        required: true,
      }),
      comment: t.input.string(),
    },
    resolve: async (_, { input }, { session }) => {
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

      const code = input.content.code;
      const varNames = code ? getExportedVariableNames(code) : [];

      const model = await prisma.$transaction(async (tx) => {
        const variables = await Promise.all(
          varNames.map((varName) =>
            tx.variable.upsert({
              where: {
                uniqueKey: {
                  modelId: existingModel.id,
                  variableName: varName,
                },
              },
              create: {
                variableName: varName,
                model: {
                  connect: { id: existingModel.id },
                },
              },
              update: {},
            })
          )
        );

        const revision = await tx.modelRevision.create({
          data: {
            squiggleSnippet: {
              create: {
                code: input.content.code,
                version: input.content.version,
                seed: input.content.seed,
                autorunMode: input.content.autorunMode ?? null,
                sampleCount: input.content.sampleCount ?? null,
                xyPointLength: input.content.xyPointLength ?? null,
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
            variableRevisions: {
              createMany: {
                data: variables.map((variable) => ({
                  variableName: variable.variableName,
                  variableId: variable.id,
                })),
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

      return { model };
    },
  })
);
