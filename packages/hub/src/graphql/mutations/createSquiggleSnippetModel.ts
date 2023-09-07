import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";

import { Model } from "../types/Model";
import { rethrowOnConstraint } from "../errors/common";

builder.mutationField("createSquiggleSnippetModel", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("CreateSquiggleSnippetResult", {
      fields: (t) => ({
        model: t.field({
          type: Model,
          nullable: false,
        }),
      }),
    }),
    errors: {},
    input: {
      groupSlug: t.input.string(),
      code: t.input.string({ required: true }),
      slug: t.input.string({
        required: true,
        validate: {
          regex: /^\w[\w\-]*$/,
        },
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const model = await prisma.$transaction(async (tx) => {
        // nested create is not possible here;
        // similar problem is described here: https://github.com/prisma/prisma/discussions/14937,
        // seems to be caused by multiple Model -> ModelRevision relations
        const model = await rethrowOnConstraint(
          () =>
            tx.model.create({
              data: {
                ...(input.groupSlug
                  ? {
                      group: {
                        connect: {
                          slug: input.groupSlug,
                          memberships: {
                            some: {
                              user: {
                                email: session.user.email,
                              },
                            },
                          },
                        },
                      },
                    }
                  : {
                      user: {
                        connect: { email: session.user.email },
                      },
                    }),
                slug: input.slug,
              },
            }),
          {
            target: ["slug", "userId"],
            error: `The model ${input.slug} already exists on this account`,
          },
          {
            target: ["slug", "groupId"],
            error: `The model ${input.slug} already exists in this group`,
          }
        );

        const revision = await tx.modelRevision.create({
          data: {
            squiggleSnippet: {
              create: {
                code: input.code,
              },
            },
            contentType: "SquiggleSnippet",
            model: {
              connect: {
                id: model.id,
              },
            },
          },
        });

        return await tx.model.update({
          where: {
            id: model.id,
          },
          data: {
            currentRevisionId: revision.id,
          },
        });
      });

      return { model };
    },
  })
);
