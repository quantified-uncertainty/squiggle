import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { Group, GroupConnection } from "../types/Group";

builder.queryField("groups", (t) =>
  t.prismaConnection(
    {
      type: Group,
      cursor: "id",
      resolve: (query) => {
        return prisma.group.findMany({
          ...query,
          orderBy: {
            updatedAt: "desc",
          },
        });
      },
    },
    GroupConnection
  )
);
