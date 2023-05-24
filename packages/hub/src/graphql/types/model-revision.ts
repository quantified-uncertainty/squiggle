import { builder } from "@/graphql/builder";
import { Definition } from "./definition";
import { prisma } from "@/prisma";

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

const ModelRevisionForDefinition = builder.simpleObject(
  "ModelRevisionForDefinition",
  {
    fields: (t) => ({
      definition: t.field({ type: Definition }),
      variable: t.string(),
      // TODO - cached outputs here?
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
    forDefinition: t.fieldWithInput({
      type: ModelRevisionForDefinition,
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
        const variableWithDefinition =
          await prisma.variableWithDefinition.findFirst({
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
        if (!variableWithDefinition) {
          throw new Error("VariableWithDefinition not found");
        }

        return {
          definition: variableWithDefinition.definition,
          variable: variableWithDefinition.variable,
        };
      },
    }),
  }),
});

export const ModelRevisionConnection = builder.connectionObject({
  type: ModelRevision,
  name: "ModelRevisionConnection",
});
