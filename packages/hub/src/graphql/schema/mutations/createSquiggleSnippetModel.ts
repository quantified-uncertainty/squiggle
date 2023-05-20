import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";
import { Model } from "../types/models";

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
      description: t.input.string(),
      slug: t.input.string({
        required: true,
        validate: {
          regex: /^\w[\w\-]*$/,
        },
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const email = session?.user.email;
      if (!email) {
        // shouldn't happen because we checked user auth scope previously, but helps with type checks
        throw new Error("Email is missing");
      }

      const model = await prisma.model.create({
        data: {
          owner: {
            connect: { email },
          },
          slug: input.slug,
          revisions: {
            create: {
              squiggleSnippet: {
                create: {
                  code: input.code,
                },
              },
              contentType: "SquiggleSnippet",
              description: input.description ?? "",
            },
          },
        },
      });

      return { model };
    },
  })
);
