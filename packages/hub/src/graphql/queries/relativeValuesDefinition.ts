import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { NotFoundError } from "../errors/NotFoundError";

builder.queryField("relativeValuesDefinition", (t) =>
  t.prismaFieldWithInput({
    type: "RelativeValuesDefinition",
    input: {
      slug: t.input.string({ required: true }),
      owner: t.input.string({ required: true }),
    },
    errors: {
      types: [NotFoundError],
    },
    async resolve(query, _, args) {
      const definition = await prisma.relativeValuesDefinition.findFirst({
        ...query,
        where: {
          slug: args.input.slug,
          owner: { slug: args.input.owner },
        },
      });
      if (!definition) {
        throw new NotFoundError();
      }
      return definition;
    },
  })
);
