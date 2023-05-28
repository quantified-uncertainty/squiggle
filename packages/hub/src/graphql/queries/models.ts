import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { Model, ModelConnection } from "../types/Model";

builder.queryField("models", (t) =>
  t.prismaConnection(
    {
      type: Model,
      cursor: "id",
      resolve: (query) =>
        prisma.model.findMany({
          ...query,
          orderBy: {
            createdAt: "desc",
          },
        }),
    },
    ModelConnection
  )
);
