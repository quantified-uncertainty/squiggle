import { Prisma } from "@prisma/client";

import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";

import { User } from "../types/User";

const UsersQueryInput = builder.inputType("UsersQueryInput", {
  fields: (t) => ({
    usernameContains: t.string(),
  }),
});

builder.queryField("users", (t) =>
  t.prismaConnection({
    type: User,
    cursor: "id",
    args: {
      input: t.arg({ type: UsersQueryInput }),
    },
    resolve: async (query, _, { input }) => {
      const where: Prisma.UserWhereInput = {
        ownerId: { not: null },
      };

      if (input?.usernameContains) {
        where.asOwner = {
          slug: { contains: input.usernameContains },
        };
      }

      return await prisma.user.findMany({
        ...query,
        where,
      });
    },
  })
);
