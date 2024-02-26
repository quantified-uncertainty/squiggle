import { builder } from "@/graphql/builder";

export const ModelExport = builder.prismaNode("ModelExport", {
  id: { field: "id" },
  fields: (t) => ({
    modelRevision: t.relation("modelRevision"),
    variableName: t.exposeString("variableName"),
    variableType: t.exposeString("variableType"),
    docstring: t.exposeString("docstring"),
    title: t.exposeString("title", { nullable: true }),
  }),
});

export const ModelExportConnection = builder.connectionObject({
  type: ModelExport,
  name: "ModelExportConnection",
});
