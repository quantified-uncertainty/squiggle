import { prismaConnectionHelpers } from "@pothos/plugin-prisma";

import { builder } from "@/graphql/builder";

export const ModelRevisionBuild = builder.prismaNode("ModelRevisionBuild", {
  id: { field: "id" },
  fields: (t) => ({
    createdAtTimestamp: t.float({
      resolve: (group) => group.createdAt.getTime(),
    }),
    modelRevision: t.relation("modelRevision"),
    errors: t.exposeStringList("errors"),
    runTime: t.exposeFloat("runTime"),
  }),
});

export const ModelRevisionBuildConnection = builder.connectionObject({
  type: ModelRevisionBuild,
  name: "ModelRevisionBuildConnection",
});

export const modelConnectionHelpers = prismaConnectionHelpers(
  builder,
  "ModelRevisionBuild",
  { cursor: "id" }
);
