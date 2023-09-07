import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { modelWhereHasAccess } from "../types/Model";
import { OwnerInput, validateOwner } from "../types/Owner";

builder.queryField("model", (t) =>
  t.prismaFieldWithInput({
    type: "Model",
    input: {
      slug: t.input.string({ required: true }),
      owner: t.input.field({
        type: OwnerInput,
        required: true,
      }),
    },
    errors: {
      types: [NotFoundError],
    },
    async resolve(query, _, { input }, { session }) {
      const owner = validateOwner(input.owner);
      const model = await prisma.model.findFirst({
        ...query,
        where: {
          slug: input.slug,
          // copy-pasted from getWriteableModel()
          ...(owner.type === "User"
            ? {
                user: {
                  username: owner.name,
                },
              }
            : owner.type === "Group"
            ? {
                group: {
                  slug: owner.name,
                },
              }
            : ({} as never)),
          // no need to check access - will be checked by Model authScopes
        },
      });
      if (!model) {
        throw new NotFoundError();
      }
      return model;
    },
  })
);
