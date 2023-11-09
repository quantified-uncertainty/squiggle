import { builder } from "@/graphql/builder";

export const ModelExport = builder.prismaNode("ModelExport", {
  id: { field: "id" },
  fields: (t) => ({
    modelRevision: t.relation("modelRevision"),
    variableName: t.exposeString("variableName"),
    title: t.exposeString("title", { nullable: true }),
  }),
});
