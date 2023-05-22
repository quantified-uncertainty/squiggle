import { builder } from "@/graphql/builder";
import { Definition } from "../types/definitions";
import { prisma } from "@/prisma";

builder.mutationField("createRelativeValuesDefinition", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("CreateRelativeValuesDefinitionResult", {
      fields: (t) => ({
        definition: t.field({
          type: Definition,
          nullable: false,
        }),
      }),
    }),
    authScopes: {
      user: true,
    },
    errors: {},
    input: {
      // TODO - extract to helper module
      slug: t.input.string({
        required: true,
        validate: {
          regex: /^\w[\w\-]*$/,
        },
      }),
      title: t.input.string({
        required: true,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const email = session?.user.email;
      if (!email) {
        // shouldn't happen because we checked user auth scope previously, but helps with type checks
        throw new Error("Email is missing");
      }

      const definition = await prisma.definition.create({
        data: {
          owner: {
            connect: { email },
          },
          slug: input.slug,
          revisions: {
            create: {
              relativeValues: {
                create: {
                  title: input.title,
                  items: [
                    {
                      id: "foo",
                    },
                    {
                      id: "bar",
                    },
                  ],
                  clusters: [],
                },
              },
              contentType: "RelativeValues",
            },
          },
        },
      });

      return { definition };
    },
  })
);
