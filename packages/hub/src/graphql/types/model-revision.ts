import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

export const SquiggleSnippet = builder.prismaNode("SquiggleSnippet", {
  id: { field: "id" },
  fields: (t) => ({
    dbId: t.exposeID("id"),
    code: t.exposeString("code"),
  }),
});

// TODO - turn into interface?
export const ModelContent = builder.unionType("ModelContent", {
  types: [SquiggleSnippet],
  resolveType: () => SquiggleSnippet,
});

const RelativeValuesExport = builder.prismaNode("RelativeValuesExport", {
  id: { field: "id" },
  fields: (t) => ({
    definition: t.relation("definition"),
    variableName: t.exposeString("variableName"),
  }),
});

export const ModelRevision = builder.prismaNode("ModelRevision", {
  id: { field: "id" },
  fields: (t) => ({
    dbId: t.exposeID("id"),
    createdAtTimestamp: t.float({
      resolve: (revision) => revision.createdAt.getTime(),
    }),
    description: t.exposeString("description"),
    // `relatedConnection` would be more principled, and in theory the number of variables with definitions could be high.
    // But connection is harder to deal with on the UI side, since and we send all variables back on updates, so it doesn't make much sense there.
    relativeValuesExports: t.relation("relativeValuesExports"),
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
      nullable: true,
      input: {
        variableName: t.input.string({ required: true }),
        // optional, necessary if the variable is associated with multiple definitions
        for: t.input.field({
          required: false,
          type: builder.inputType(
            "ModelRevisionForRelativeValuesSlugUsernameInput",
            {
              fields: (t) => ({
                slug: t.string({ required: true }),
                username: t.string({ required: true }),
              }),
            }
          ),
        }),
      },
      argOptions: {
        required: false,
      },
      async resolve(revision, { input }) {
        if (!input) {
          return null;
        }

        const exports = await prisma.relativeValuesExport.findMany({
          where: {
            modelRevisionId: revision.id,
            variableName: input.variableName,
            ...(input.for
              ? {
                  definition: {
                    owner: {
                      username: input.for.username,
                    },
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
          throw new Error("Not found");
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
