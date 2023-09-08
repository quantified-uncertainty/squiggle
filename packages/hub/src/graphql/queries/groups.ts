import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { Group } from "../types/Group";

const GroupsQueryInput = builder.inputType("GroupsQueryInput", {
  fields: (t) => ({
    slugContains: t.string(),
  }),
});

builder.queryField("groups", (t) =>
  t.prismaConnection({
    type: Group,
    cursor: "id",
    args: {
      input: t.arg({ type: GroupsQueryInput }),
    },
    resolve: (query, _, { input }) => {
      return prisma.group.findMany({
        ...query,
        orderBy: {
          updatedAt: "desc",
        },
        where: {
          ...(input?.slugContains && {
            asOwner: {
              slug: {
                contains: input.slugContains,
              },
            },
          }),
        },
      });
    },
  })
);
