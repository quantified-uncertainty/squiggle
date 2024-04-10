import { builder } from "@/graphql/builder";

export const ModelRevisionBuild = builder.prismaNode("ModelRevisionBuild", {
  id: { field: "id" },
  fields: (t) => ({
    createdAtTimestamp: t.float({
      resolve: (group) => group.createdAt.getTime(),
    }),
    modelRevision: t.relation("modelRevision"),
    errors: t.exposeStringList("errors"),
    runSeconds: t.exposeFloat("runSeconds"),
  }),
});
