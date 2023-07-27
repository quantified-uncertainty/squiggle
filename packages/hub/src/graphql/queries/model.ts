import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { NotFoundError } from "../errors/NotFoundError";

builder.queryField("model", (t) =>
  t.prismaFieldWithInput({
    type: "Model",
    input: {
      slug: t.input.string({ required: true }),
      ownerUsername: t.input.string({ required: true }),
    },
    errors: {
      types: [NotFoundError],
    },
    async resolve(query, _, args) {
      const model = await prisma.model.findFirst({
        ...query,
        where: {
          slug: args.input.slug,
          owner: {
            username: args.input.ownerUsername,
          },
        },
      });
      if (!model) {
        throw new NotFoundError();
      }
      return model;
    },
  })
);
