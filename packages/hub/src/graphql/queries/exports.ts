import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { ModelExport, ModelExportConnection } from "../types/ModelExport";

const ModelExportQueryInput = builder.inputType("ModelExportQueryInput", {
  fields: (t) => ({
    modelId: t.string(),
    variableName: t.string(),
    owner: t.string(),
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
            ...(input?.owner && {
              modelRevision: { model: { owner: { slug: input.owner } } },
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
