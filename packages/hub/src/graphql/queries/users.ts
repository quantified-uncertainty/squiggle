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
    resolve: (query, _, args) =>
      prisma.user.findMany({
        ...query,
        where: {
          username: { not: null },
          ...(args.input?.usernameContains && {
            username: {
              contains: args.input.usernameContains,
            },
          }),
        },
      }),
  })
);
