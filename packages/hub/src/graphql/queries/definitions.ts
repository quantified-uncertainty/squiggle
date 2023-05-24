import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { Definition, DefinitionConnection } from "../types/definition";

builder.queryField("definitions", (t) =>
  t.prismaConnection(
    {
      type: Definition,
      cursor: "id",
      resolve: (query) =>
        prisma.definition.findMany({
          ...query,
          orderBy: {
            createdAt: "desc",
          },
        }),
    },
    DefinitionConnection
  )
);
