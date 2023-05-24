import { builder } from "@/graphql/builder";
import { Definition } from "./definitions";

export const SquiggleSnippet = builder.prismaNode("SquiggleSnippet", {
  id: { field: "id" },
  fields: (t) => ({
    dbId: t.exposeID("id"),
    code: t.exposeString("code"),
  }),
});

// TODO - turn into interface, `createdAt` field should be common
export const ModelContent = builder.unionType("ModelContent", {
  types: [SquiggleSnippet],
  resolveType: () => SquiggleSnippet,
});

export const VariableWithDefinition = builder.prismaNode(
  "VariableWithDefinition",
  {
    id: { field: "id" },
    fields: (t) => ({
      variable: t.exposeString("variable"),
      definition: t.relation("definition"),
    }),
  }
);

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
    variablesWithDefinitions: t.relation("variablesWithDefinitions"),
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
  }),
});

export const ModelRevisionConnection = builder.connectionObject({
  type: ModelRevision,
  name: "ModelRevisionConnection",
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
    currentRevision: t.field({
      type: ModelRevision,
      select: (_, __, nestedSelection) => ({
        revisions: nestedSelection({
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        }),
      }),
      async resolve(model) {
        return model.revisions[0];
      },
    }),
    revision: t.field({
      type: ModelRevision,
      args: {
        id: t.arg.id({ required: true }),
      },
      select: (args, _, nestedSelection) => ({
        revisions: nestedSelection({
          take: 1,
          where: { id: args.id },
        }),
      }),
      async resolve(model) {
        const revision = model.revisions[0];
        if (!revision) {
          throw new Error("Not found");
        }
        return revision;
      },
    }),
    revisions: t.relatedConnection(
      "revisions",
      {
        cursor: "id",
        query: () => ({
          orderBy: {
            createdAt: "desc",
          },
        }),
      },
      ModelRevisionConnection
    ),
    owner: t.relation("owner"),
  }),
});

export const ModelConnection = builder.connectionObject({
  type: Model,
  name: "ModelConnection",
});
