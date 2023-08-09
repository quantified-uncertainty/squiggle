import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

const GlobalStatistics = builder.simpleObject("GlobalStatistics", {}, (t) => ({
  users: t.int({
    async resolve() {
      return await prisma.user.count();
    },
  }),
  models: t.int({
    async resolve() {
      return await prisma.model.count();
    },
  }),
  relativeValuesDefinitions: t.int({
    async resolve() {
      return await prisma.relativeValuesDefinition.count();
    },
  }),
}));

builder.queryField("globalStatistics", (t) =>
  t.field({
    type: GlobalStatistics,
    resolve: () => ({}),
  })
);
