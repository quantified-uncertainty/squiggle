import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";

import { Model } from "../types/Model";

builder.queryField("model", (t) =>
  t.fieldWithInput({
    type: Model,
    input: {
      slug: t.input.string({ required: true }),
      ownerUsername: t.input.string({ required: true }),
    },
    async resolve(root, args) {
      const model = await prisma.model.findFirstOrThrow({
        where: {
          slug: args.input.slug,
          owner: {
            username: args.input.ownerUsername,
          },
        },
      });
      return model;
    },
  })
);
