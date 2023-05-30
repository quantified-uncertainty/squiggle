import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

builder.queryField("userByUsername", (t) =>
  t.prismaField({
    type: "User",
    args: {
      username: t.arg.string({ required: true }),
    },
    async resolve(query, _, args) {
      return await prisma.user.findUniqueOrThrow({
        ...query,
        where: {
          username: args.username,
        },
      });
    },
  })
);
