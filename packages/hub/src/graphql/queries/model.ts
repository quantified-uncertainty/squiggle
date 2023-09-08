import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { NotFoundError } from "../errors/NotFoundError";

builder.queryField("model", (t) =>
  t.prismaFieldWithInput({
    type: "Model",
    input: {
      slug: t.input.string({ required: true }),
      owner: t.input.string({ required: true }),
    },
    errors: {
      types: [NotFoundError],
    },
    async resolve(query, _, { input }) {
      const model = await prisma.model.findFirst({
        ...query,
        where: {
          slug: input.slug,
          owner: { slug: input.owner },
          // no need to check access - will be checked by Model authScopes
        },
      });
      if (!model) {
        throw new NotFoundError();
      }
      return model;
    },
  })
);
