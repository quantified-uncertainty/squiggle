import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";

import { User } from "../types/User";

builder.queryField("userByUsername", (t) =>
  t.field({
    type: User,
    args: {
      username: t.arg.string({ required: true }),
    },
    async resolve(_, args) {
      const user = await prisma.user.findUnique({
        where: {
          username: args.username,
        },
      });
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    },
  })
);
