import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { NotFoundError } from "../errors/NotFoundError";
import { RelativeValuesExport } from "./RelativeValuesExport";

export const SquiggleSnippet = builder.prismaNode("SquiggleSnippet", {
  id: { field: "id" },
  fields: (t) => ({
    code: t.exposeString("code"),
    version: t.exposeString("version"),
    seed: t.exposeString("seed"),
    autorunMode: t.exposeBoolean("autorunMode", { nullable: true }),
    sampleCount: t.exposeInt("sampleCount", { nullable: true }),
    xyPointLength: t.exposeInt("xyPointLength", { nullable: true }),
  }),
});

// TODO - turn into interface?
export const ModelContent = builder.unionType("ModelContent", {
  types: [SquiggleSnippet],
  resolveType: () => SquiggleSnippet,
});

builder.prismaNode("ModelExport", {
  id: { field: "id" },
  fields: (t) => ({
    modelRevision: t.relation("modelRevision"),
    variableName: t.exposeString("variableName"),
    variableType: t.exposeString("variableType"),
    docstring: t.exposeString("docstring"),
    title: t.exposeString("title", { nullable: true }),
  }),
});

export const ModelRevision = builder.prismaNode("ModelRevision", {
  id: { field: "id" },
  fields: (t) => ({
    createdAtTimestamp: t.float({
      resolve: (revision) => revision.createdAt.getTime(),
    }),
    // `relatedConnection` would be more principled, and in theory the number of variables with definitions could be high.
    // But connection is harder to deal with on the UI side, and since we send all variables back on updates, so it doesn't make much sense there.
    relativeValuesExports: t.relation("relativeValuesExports"),
    exports: t.relation("exports"),
    model: t.relation("model"),
    author: t.relation("author", { nullable: true }),
    comment: t.exposeString("comment"),
    content: t.field({
      type: ModelContent,
      select: { squiggleSnippet: true },
      async resolve(revision) {
        switch (revision.contentType) {
          case "SquiggleSnippet":
            return revision.squiggleSnippet;
        }
      },
    }),
    forRelativeValues: t.fieldWithInput({
      type: RelativeValuesExport,
      errors: {
        types: [NotFoundError],
      },
      input: {
        variableName: t.input.string({ required: true }),
        // optional, necessary if the variable is associated with multiple definitions
        for: t.input.field({
          type: builder.inputType(
            "ModelRevisionForRelativeValuesSlugOwnerInput",
            {
              fields: (t) => ({
                slug: t.string({ required: true }),
                owner: t.string({ required: true }),
              }),
            }
          ),
        }),
      },
      async resolve(revision, { input }) {
        const exports = await prisma.relativeValuesExport.findMany({
          where: {
            modelRevisionId: revision.id,
            variableName: input.variableName,
            ...(input.for
              ? {
                  definition: {
                    owner: { slug: input.for.owner },
                    slug: input.for.slug,
                  },
                }
              : {}),
          },
          include: {
            definition: true,
          },
        });

        if (exports.length > 1) {
          throw new Error("Ambiguous input, multiple variables match it");
        }

        if (exports.length === 0) {
          throw new NotFoundError();
        }

        return exports[0];
      },
    }),
  }),
});

export const ModelRevisionConnection = builder.connectionObject({
  type: ModelRevision,
  name: "ModelRevisionConnection",
});
