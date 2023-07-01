import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import {
  RelativeValuesDefinition,
  RelativeValuesDefinitionConnection,
} from "../types/RelativeValuesDefinition";

const RelativeValuesDefinitionsQueryInput = builder.inputType(
  "RelativeValuesDefinitionsQueryInput",
  {
    fields: (t) => ({
      slugContains: t.string(),
      ownerUsername: t.string(),
    }),
  }
);

builder.queryField("relativeValuesDefinitions", (t) =>
  t.prismaConnection(
    {
      type: RelativeValuesDefinition,
      cursor: "id",
      args: {
        input: t.arg({ type: RelativeValuesDefinitionsQueryInput }),
      },
      resolve: (query, _, args) =>
        prisma.relativeValuesDefinition.findMany({
          ...query,
          where: {
            ...(args.input?.slugContains && {
              slug: {
                contains: args.input.slugContains,
              },
            }),
            ...(args.input?.ownerUsername && {
              owner: {
                username: args.input.ownerUsername,
              },
            }),
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
    },
    RelativeValuesDefinitionConnection
  )
);
