import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { ModelExport, ModelExportConnection } from "../types/ModelExport";

const ModelExportQueryInput = builder.inputType("ModelExportQueryInput", {
  fields: (t) => ({
    slugContains: t.string(),
    owner: t.string(),
  }),
});

builder.queryField("modelExports", (t) =>
  t.prismaConnection(
    {
      type: ModelExport,
      cursor: "id",
      resolve: (query, _, __, { session }) => {
        return prisma.modelExport.findMany({
          ...query,
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
