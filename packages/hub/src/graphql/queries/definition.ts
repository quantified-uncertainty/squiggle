import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

builder.queryField("relativeValuesDefinition", (t) =>
  t.prismaFieldWithInput({
    type: "RelativeValuesDefinition",
    input: {
      slug: t.input.string({ required: true }),
      ownerUsername: t.input.string({ required: true }),
    },
    async resolve(query, _, args) {
      return await prisma.relativeValuesDefinition.findFirstOrThrow({
        ...query,
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
