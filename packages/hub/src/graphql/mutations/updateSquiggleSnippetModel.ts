import { RelativeValuesDefinition } from "@prisma/client";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { squiggleVersions } from "@quri/versioned-playground";
import { Model, getWriteableModel } from "../types/Model";
import { getSelf } from "../types/User";

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

      const model = await prisma.$transaction(async (tx) => {
        const revision = await tx.modelRevision.create({
          data: {
            squiggleSnippet: {
              create: {
                code: input.content.code,
                version: input.content.version,
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

        const model = await tx.model.update({
          where: {
            id: revision.model.id,
          },
          data: {
            currentRevisionId: revision.id,
          },
          // TODO - optimize with queryFromInfo, https://pothos-graphql.dev/docs/plugins/prisma#optimized-queries-without-tprismafield
        });

        return model;
      });

      return { model };
    },
  })
);
