import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { modelWhereHasAccess } from "../types/Model";

builder.queryField("model", (t) =>
  t.prismaFieldWithInput({
    type: "Model",
    input: {
      slug: t.input.string({ required: true }),
      ownerUsername: t.input.string({ required: true }),
    },
    errors: {
      types: [NotFoundError],
    },
    async resolve(query, _, args, { session }) {
      const model = await prisma.model.findFirst({
        ...query,
        where: {
          slug: args.input.slug,
          user: {
            username: args.input.ownerUsername,
          },
          ...modelWhereHasAccess(session), // slightly risky - what if we change the query there and there's a collision?
        },
      });
      if (!model) {
        throw new NotFoundError();
      }
      return model;
    },
  })
);
