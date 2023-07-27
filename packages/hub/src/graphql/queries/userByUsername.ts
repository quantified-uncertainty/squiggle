import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { NotFoundError } from "../errors/NotFoundError";

builder.queryField("userByUsername", (t) =>
  t.prismaField({
    type: "User",
    args: {
      username: t.arg.string({ required: true }),
    },
    errors: {
      types: [NotFoundError],
    },
    async resolve(query, _, args) {
      const user = await prisma.user.findUnique({
        ...query,
        where: {
          username: args.username,
        },
      });
      if (!user) {
        throw new NotFoundError();
      }
      return user;
    },
  })
);
