import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { Model, ModelConnection, modelWhereHasAccess } from "../types/Model";
import { ModelExport, ModelExportConnection } from "../types/ModelExport";

//include field, nested...

builder.queryField("modelsExports", (t) =>
  t.prismaConnection(
    {
      type: ModelExport,
      cursor: "id", // Ensure this is a unique field of Model
      resolve: (query, _, __, { session }) => {
        const foo = prisma.model
          .findMany({
            ...query,
            orderBy: {
              updatedAt: "desc",
            },
            where: modelWhereHasAccess(session),
            include: {
              currentRevision: {
                include: {
                  exports: true,
                },
              },
            },
          })
          .then((models) => {
            // Transform models to get modelExports from currentRevision
            return models.flatMap(
              (model) => model.currentRevision?.modelExports ?? []
            );
          });
        return [];
      },
    },
    ModelExportConnection
  )
);
