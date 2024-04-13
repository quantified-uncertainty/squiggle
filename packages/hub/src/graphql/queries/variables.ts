import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { modelWhereHasAccess } from "../helpers/modelHelpers";
import { Variable, VariableConnection } from "../types/Variable";

const VariableQueryInput = builder.inputType("VariableQueryInput", {
  fields: (t) => ({
    modelId: t.string(),
    variableName: t.string(),
    owner: t.string(),
  }),
});

builder.queryField("variables", (t) =>
  t.prismaConnection(
    {
      type: Variable,
      cursor: "id",
      args: {
        input: t.arg({ type: VariableQueryInput }),
      },
      resolve: (query, _, { input }, { session }) => {
        const modelId = input?.modelId;

        const queries = {
          model: {
            ...modelWhereHasAccess(session),
            ...(input?.owner && { owner: { slug: input.owner } }),
          },
          ...(modelId && { modelId: modelId }),
          ...(input?.variableName && { variableName: input.variableName }),
        };

        return prisma.variable.findMany({
          ...query,
          where: {
            ...queries,
          },
        });
      },
    },
    VariableConnection
  )
);
