import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import {
  RelativeValuesDefinition,
  RelativeValuesDefinitionConnection,
} from "../types/RelativeValuesDefinition";

builder.queryField("relativeValuesDefinitions", (t) =>
  t.prismaConnection(
    {
      type: RelativeValuesDefinition,
      cursor: "id",
      resolve: (query) =>
        prisma.relativeValuesDefinition.findMany({
          ...query,
          orderBy: {
            createdAt: "desc",
          },
        }),
    },
    RelativeValuesDefinitionConnection
  )
);
