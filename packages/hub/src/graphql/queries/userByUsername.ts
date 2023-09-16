import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { User } from "../types/User";

builder.queryField("userByUsername", (t) =>
  t.prismaField({
    type: User,
    args: {
      username: t.arg.string({ required: true }),
    },
    errors: {
      types: [NotFoundError],
    },
    async resolve(query, _, args) {
      const user = await prisma.user.findFirst({
        ...query,
        where: {
          asOwner: {
            slug: args.username,
          },
        },
      });
      if (!user) {
        throw new NotFoundError(`User ${args.username} not found`);
      }
      return user;
    },
  })
);
