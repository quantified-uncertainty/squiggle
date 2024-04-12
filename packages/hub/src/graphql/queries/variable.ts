import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { NotFoundError } from "../errors/NotFoundError";

builder.queryField("variable", (t) =>
  t.prismaFieldWithInput({
    type: "Variable",
    input: {
      modelId: t.input.string({ required: true }),
      variableName: t.input.string({ required: true }),
    },
    errors: {
      types: [NotFoundError],
    },
    async resolve(query, _, { input }) {
      const variable = await prisma.variable.findFirst({
        ...query,
        where: {
          modelId: input.modelId,
          variableName: input.variableName,
          // no need to check access - will be checked by Variable authScopes
        },
      });

      if (!variable) {
        throw new NotFoundError();
      }

      return variable;
    },
  })
);
