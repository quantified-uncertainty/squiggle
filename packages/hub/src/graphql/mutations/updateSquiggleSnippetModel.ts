import { RelativeValuesDefinition } from "@prisma/client";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { Model, getWriteableModel } from "../types/Model";
import { OwnerInput, validateOwner } from "../types/Owner";

const DefinitionRefInput = builder.inputType("DefinitionRefInput", {
  fields: (t) => ({
    username: t.string({ required: true }),
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
    }),
  }
);

builder.mutationField("updateSquiggleSnippetModel", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("UpdateSquiggleSnippetResult", {
      fields: (t) => ({
        model: t.field({ type: Model }),
      }),
    }),
    errors: {},
    input: {
      owner: t.input.field({ type: OwnerInput, required: true }),
      slug: t.input.string({ required: true }),
      relativeValuesExports: t.input.field({
        type: [RelativeValuesExportInput],
      }),
      code: t.input.string({ deprecationReason: "Use content arg instead" }),
      content: t.input.field({
        type: SquiggleSnippetContentInput,
        // TODO - should be required after `code` input is removed
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const existingModel = await getWriteableModel({
        slug: input.slug,
        session,
        owner: validateOwner(input.owner),
      });

      const code = input.code ?? input.content?.code;
      if (code === undefined) {
        // remove this after `code` support is removed
        throw new Error("One of `code` and `content.code` must be set");
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
                owner: {
                  username: pair.definition.username,
                },
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
          const { username } = definition.owner;
          if (username === null) {
            continue; // should never happen
          }
          if (!linkedDefinitions.has(username)) {
            linkedDefinitions.set(username, new Map());
          }
          linkedDefinitions.get(username)?.set(definition.slug, definition);
        }
        for (const pair of relativeValuesExports) {
          const definition = linkedDefinitions
            .get(pair.definition.username)
            ?.get(pair.definition.slug);

          if (!definition) {
            throw new Error(
              `Definition with username=${pair.definition.username}, slug ${pair.definition.slug} not found`
            );
          }
          relativeValuesExportsToInsert.push({
            variableName: pair.variableName,
            definitionId: definition.id,
          });
        }
      }

      const model = await prisma.$transaction(async (tx) => {
        const revision = await tx.modelRevision.create({
          data: {
            squiggleSnippet: {
              create: { code },
            },
            contentType: "SquiggleSnippet",
            model: {
              connect: {
                id: existingModel.id,
              },
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
