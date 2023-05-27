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
        slug: t.input.string({ required: true }),
        username: t.input.string({ required: true }),
      },
      argOptions: {
        required: false,
      },
      async resolve(revision, { input }) {
        if (!input) {
          return null;
        }

        return await prisma.relativeValuesExport.findFirstOrThrow({
          where: {
            modelRevisionId: revision.id,
            definition: {
              owner: {
                username: input.username,
              },
              slug: input.slug,
            },
          },
          include: {
            definition: true,
          },
        });
      },
    }),
  }),
});

export const ModelRevisionConnection = builder.connectionObject({
  type: ModelRevision,
  name: "ModelRevisionConnection",
});
