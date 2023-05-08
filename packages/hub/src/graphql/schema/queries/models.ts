import { builder } from "@/graphql/builder";
import { Model, ModelConnection } from "../types/models";
import { prisma } from "@/prisma";

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
