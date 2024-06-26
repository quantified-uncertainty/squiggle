import { builder } from "@/graphql/builder";

export const ModelRevisionBuild = builder.prismaNode("ModelRevisionBuild", {
  id: { field: "id" },
  fields: (t) => ({
    createdAtTimestamp: t.float({
      resolve: (build) => build.createdAt.getTime(),
    }),
    modelRevision: t.relation("modelRevision"),
    errors: t.stringList({
      resolve: (build) => build.errors.filter((e) => e !== ""),
    }),
    runSeconds: t.exposeFloat("runSeconds"),
  }),
});
