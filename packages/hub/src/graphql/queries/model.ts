import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

builder.queryField("model", (t) =>
  t.prismaFieldWithInput({
    type: "Model",
    input: {
      slug: t.input.string({ required: true }),
      ownerUsername: t.input.string({ required: true }),
    },
    async resolve(query, _, args) {
      const model = await prisma.model.findFirstOrThrow({
        ...query,
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
