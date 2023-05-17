import { builder } from "@/graphql/builder";

export const SquiggleSnippet = builder.prismaNode("SquiggleSnippet", {
  id: { field: "id" },
  fields: (t) => ({
    code: t.exposeString("code"),
    createdAtTimestamp: t.float({
      resolve: (snippet) => snippet.createdAt.getTime(),
    }),
  }),
});

// TODO - turn into interface, `createdAt` field should be common
export const ModelContent = builder.unionType("ModelContent", {
  types: [SquiggleSnippet],
  resolveType: () => SquiggleSnippet,
});

export const SquiggleSnippetConnection = builder.connectionObject({
  type: SquiggleSnippet,
  name: "SquiggleSnippetConnection",
});

export const Model = builder.prismaNode("Model", {
  id: { field: "id" },
  fields: (t) => ({
    slug: t.exposeString("slug"),
    // I'm not yet sure if we'll use custom scalars for datetime encoding, so `createdAtTimestamp` is a precaution; we'll probably switch to `createAt` in the future
    createdAtTimestamp: t.float({
      resolve: (model) => model.createdAt.getTime(),
    }),
    updatedAtTimestamp: t.float({
      resolve: (model) => model.updatedAt.getTime(),
    }),
    content: t.field({
      type: ModelContent,
      select: (args, ctx, nestedSelection) => ({
        squiggleSnippets: nestedSelection({
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        }),
      }),
      async resolve(model) {
        switch (model.modelType) {
          case "SquiggleSnippet":
            return model.squiggleSnippets[0];
        }
      },
    }),
    revisions: t.relatedConnection(
      "squiggleSnippets",
      {
        cursor: "id",
      },
      SquiggleSnippetConnection // should be ModelContentConnection, but it's harder to do with pothos-prisma
    ),
    owner: t.relation("owner"),
  }),
});

export const ModelConnection = builder.connectionObject({
  type: Model,
  name: "ModelConnection",
});
