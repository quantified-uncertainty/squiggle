import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { Definition } from "../types/definition";

builder.queryField("definition", (t) =>
  t.fieldWithInput({
    type: Definition,
    input: {
      slug: t.input.string({ required: true }),
      ownerUsername: t.input.string({ required: true }),
    },
    async resolve(root, args) {
      return await prisma.definition.findFirstOrThrow({
        where: {
          slug: args.input.slug,
          owner: {
            username: args.input.ownerUsername,
          },
        },
      });
    },
  })
);
