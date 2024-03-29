import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { modelWhereHasAccess } from "../helpers/modelHelpers";
import { Model, ModelConnection } from "../types/Model";

builder.queryField("models", (t) =>
  t.prismaConnection(
    {
      type: Model,
      cursor: "id",
      resolve: (query, _, __, { session }) => {
        return prisma.model.findMany({
          ...query,
          orderBy: {
            updatedAt: "desc",
          },
          where: modelWhereHasAccess(session),
        });
      },
    },
    ModelConnection
  )
);
