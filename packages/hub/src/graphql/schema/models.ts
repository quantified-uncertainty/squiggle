import { prisma } from "@/prisma";
import { builder } from "../builder";
import { User } from "./users";

const SquiggleSnippet = builder.prismaNode("SquiggleSnippet", {
  id: { field: "id" },
  fields: (t) => ({
    code: t.exposeString("code"),
  }),
});

const ModelContent = builder.unionType("ModelContent", {
  types: [SquiggleSnippet],
  resolveType: () => SquiggleSnippet,
});

const Model = builder.prismaNode("Model", {
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
      select: {
        squiggleSnippet: true,
      },
      async resolve(model) {
        switch (model.modelType) {
          case "SquiggleSnippet":
            return model.squiggleSnippet;
        }
        throw new Error(`Unknown model type ${model.modelType}`);
      },
    }),
    owner: t.relation("owner"),
  }),
});

builder.queryField("models", (t) =>
  t.prismaConnection({
    type: Model,
    cursor: "id",
    resolve: (query) => prisma.model.findMany({ ...query }),
  })
);

builder.queryField("model", (t) =>
  t.fieldWithInput({
    type: Model,
    input: {
      slug: t.input.string({ required: true }),
      ownerUsername: t.input.string({ required: true }),
    },
    async resolve(root, args) {
      const model = await prisma.model.findFirstOrThrow({
        where: {
          slug: args.input.slug,
          owner: {
            username: args.input.ownerUsername,
          },
        },
      });
      return model;
    },
  })
);

builder.mutationField("createSquiggleSnippetModel", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("CreateSquiggleSnippetResult", {
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
      code: t.input.string({ required: true }),
      slug: t.input.string({
        required: true,
        validate: {
          regex: /^\w[\w\-]*$/,
        },
      }),
    },
    resolve: async (root, args, { session }) => {
      const email = session?.user.email;
      if (!email) {
        // shouldn't happen because we checked user auth scope previously, but helps with type checks
        throw new Error("Email is missing");
      }

      const model = await prisma.model.create({
        data: {
          slug: args.input.slug,
          squiggleSnippet: {
            create: {
              code: args.input.code,
            },
          },
          modelType: "SquiggleSnippet",
          owner: {
            connect: { email },
          },
        },
      });

      return {
        model,
      };
    },
  })
);
