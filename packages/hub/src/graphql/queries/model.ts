import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { NotFoundError } from "../errors/NotFoundError";
import { modelWhereHasAccess } from "../helpers/modelHelpers";

builder.queryField("model", (t) =>
  t.prismaFieldWithInput({
    type: "Model",
    input: {
      slug: t.input.string({ required: true }),
      owner: t.input.string({ required: true }),
    },
    errors: {
      types: [NotFoundError],
    },
    async resolve(query, _, { input }, { session }) {
      const model = await prisma.model.findFirst({
        ...query,
        where: {
          slug: input.slug,
          owner: { slug: input.owner },
          // intentionally checking access - see https://github.com/quantified-uncertainty/squiggle/issues/3414
          ...modelWhereHasAccess(session),
        },
      });
      if (!model) {
        throw new NotFoundError();
      }
      return model;
    },
  })
);
