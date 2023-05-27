import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";
import { Model } from "../types/model";
import { RelativeValuesDefinition } from "@prisma/client";

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
  t.fieldWithInput({
    type: builder.simpleObject("UpdateSquiggleSnippetResult", {
      fields: (t) => ({
        model: t.field({
          type: Model,
          nullable: false,
        }),
      }),
    }),
    authScopes: {
      user: true,
    },
    errors: {},
    input: {
      username: t.input.string({ required: true }),
      slug: t.input.string({ required: true }),
      description: t.input.string(),
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
      const email = session?.user.email;
      if (!email) {
        // shouldn't happen because we checked user auth scope previously, but helps with type checks
        throw new Error("Email is missing");
      }
      if (session?.user.username !== input.username) {
        throw new Error("Can't edit another user's model");
      }

      const owner = await prisma.user.findUniqueOrThrow({
        where: {
          username: input.username,
        },
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
        const selectedDefiintions =
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
        for (let definition of selectedDefiintions) {
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

      const revision = await prisma.modelRevision.create({
        data: {
          squiggleSnippet: {
            create: { code },
          },
          contentType: "SquiggleSnippet",
          description: input.description ?? "",
          model: {
            connect: {
              slug_ownerId: {
                slug: input.slug,
                ownerId: owner.id,
              },
            },
          },
          relativeValuesExports: {
            createMany: {
              data: relativeValuesExportsToInsert,
            },
          },
        },
        select: {
          model: true,
        },
      });

      return { model: revision.model };
    },
  })
);
