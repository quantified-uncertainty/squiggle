import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";
import { User } from "../types/user";

builder.queryField("users", (t) =>
  t.prismaConnection({
    type: User,
    cursor: "id",
    resolve: (query) =>
      prisma.user.findMany({
        ...query,
        where: {
          username: { not: null },
        },
      }),
  })
);
