import { UnionRef } from "@pothos/core";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { NotFoundError } from "../errors/NotFoundError";
import { RelativeValuesExport } from "./RelativeValuesExport";
import { SquiggleSnippet } from "./SquiggleSnippet";

// TODO - turn into interface?
const ModelContent: UnionRef<
  {
    id: string;
    code: string;
    version: string;
  },
  {
    id: string;
    code: string;
    version: string;
  }
> = builder.unionType("ModelContent", {
  types: [SquiggleSnippet],
  resolveType: () => SquiggleSnippet,
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
            return revision.squiggleSnippet!;
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
