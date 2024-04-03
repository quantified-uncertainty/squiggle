import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { ModelExport, ModelExportConnection } from "../types/ModelExport";

const ModelExportQueryInput = builder.inputType("ModelExportQueryInput", {
  fields: (t) => ({
    modelId: t.string(), // Add this field to filter by model ID
    variableName: t.string(),
  }),
});

builder.queryField("modelExports", (t) =>
  t.prismaConnection(
    {
      type: ModelExport,
      cursor: "id",
      args: {
        input: t.arg({ type: ModelExportQueryInput }),
      },
      resolve: (query, _, { input }, { session }) => {
        const modelId = input?.modelId;
        return prisma.modelExport.findMany({
          ...query,
          where: {
            ...(modelId && {
              modelRevision: {
                modelId: modelId,
              },
            }),
            ...(input &&
              input.variableName && {
                variableName: input.variableName,
              }),
          },
          orderBy: {
            modelRevision: {
              createdAt: "desc",
            },
          },
          include: {
            modelRevision: true,
          },
        });
      },
    },
    ModelExportConnection
  )
);
