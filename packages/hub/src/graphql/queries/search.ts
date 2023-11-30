import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { Searchable } from "../types/Searchable";

builder.queryField("search", (t) =>
  t.prismaConnection({
    type: Searchable,
    cursor: "id",
    args: {
      text: t.arg.string({ required: true }),
    },
    errors: {},
    resolve: (query, _, { text }) => {
      return prisma.searchable.findMany({
        ...query,
        where: {
          OR: [
            { model: { slug: { search: text } } },
            { definition: { slug: { search: text } } },
            { user: { asOwner: { slug: { search: text } } } },
            { group: { asOwner: { slug: { search: text } } } },
          ],
        },
      });
    },
  })
);
