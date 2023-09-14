import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { NotFoundError } from "../errors/NotFoundError";

builder.queryField("group", (t) =>
  t.prismaField({
    type: "Group",
    args: {
      slug: t.arg.string({ required: true }),
    },
    errors: {
      types: [NotFoundError],
    },
    async resolve(query, _, args) {
      const group = await prisma.group.findFirst({
        ...query,
        where: {
          asOwner: {
            slug: args.slug,
          },
        },
      });
      if (!group) {
        throw new NotFoundError();
      }
      return group;
    },
  })
);
