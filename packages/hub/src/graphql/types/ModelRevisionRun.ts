import { prismaConnectionHelpers } from "@pothos/plugin-prisma";

import { builder } from "@/graphql/builder";

export const ModelRevisionRun = builder.prismaNode("ModelRevisionRun", {
  id: { field: "id" },
  fields: (t) => ({
    modelRevision: t.relation("modelRevision"),
    errors: t.exposeStringList("errors"),
    startedAtTimestamp: t.float({
      resolve: (group) => group.startedAt.getTime(),
    }),
    endedAtTimestamp: t.float({
      resolve: (group) => group.endedAt.getTime(),
    }),
  }),
});

export const ModelRevisionRunConnection = builder.connectionObject({
  type: ModelRevisionRun,
  name: "ModelRevisionRunConnection",
});

export const modelConnectionHelpers = prismaConnectionHelpers(
  builder,
  "ModelRevisionRun",
  { cursor: "id" }
);
