import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { Searchable } from "../types/Searchable";
import { modelWhereHasAccess } from "../helpers/modelHelpers";

builder.queryField("search", (t) =>
  t.prismaConnection({
    type: Searchable,
    cursor: "id",
    args: {
      text: t.arg.string({ required: true }),
    },
    errors: {},
    resolve: (query, _, { text }, { session }) => {
      return prisma.searchable.findMany({
        ...query,
        where: {
          OR: [
            {
              model: {
                ...modelWhereHasAccess(session),
                slug: { search: text },
              },
            },
            { definition: { slug: { search: text } } },
            { user: { asOwner: { slug: { search: text } } } },
            { group: { asOwner: { slug: { search: text } } } },
          ],
        },
      });
    },
  })
);
