import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { RelativeValuesDefinition } from "../types/definition";

builder.queryField("relativeValuesDefinition", (t) =>
  t.fieldWithInput({
    type: RelativeValuesDefinition,
    input: {
      slug: t.input.string({ required: true }),
      ownerUsername: t.input.string({ required: true }),
    },
    async resolve(root, args) {
      return await prisma.relativeValuesDefinition.findFirstOrThrow({
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
