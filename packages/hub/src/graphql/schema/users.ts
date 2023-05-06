import { prisma } from "@/prisma";
import { builder } from "../builder";

export const User = builder.prismaNode("User", {
  id: { field: "id" },
  fields: (t) => ({
    username: t.string({
      resolve(user) {
        if (!user.username) {
          throw new Error("User has no username");
        }
        return user.username;
      },
    }),
  }),
});

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
