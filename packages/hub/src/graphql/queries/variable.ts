import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { NotFoundError } from "../errors/NotFoundError";

builder.queryField("variable", (t) =>
  t.prismaFieldWithInput({
    type: "Variable",
    input: {
      variableName: t.input.string({ required: true }),
      slug: t.input.string({ required: true }),
      owner: t.input.string({ required: true }),
    },
    errors: {
      types: [NotFoundError],
    },
    async resolve(query, _, { input }) {
      const model = await prisma.model.findFirst({
        where: {
          slug: input.slug,
          owner: { slug: input.owner },
        },
      });

      if (!model) {
        throw new NotFoundError();
      }

      const variable = await prisma.variable.findFirst({
        ...query,
        where: {
          variableName: input.variableName,
          modelId: model.id,
        },
      });

      if (!variable) {
        throw new NotFoundError();
      }

      return variable;
    },
  })
);
