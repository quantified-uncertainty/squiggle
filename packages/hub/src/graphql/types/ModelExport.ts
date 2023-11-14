import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { Model, ModelConnection, modelWhereHasAccess } from "../types/Model";

builder.prismaNode("ModelExport", {
  id: { field: "id" },
  fields: (t) => ({
    modelRevision: t.relation("modelRevision"),
    variableName: t.exposeString("variableName"),
    title: t.exposeString("title", { nullable: true }),
  }),
});

export const ModelExport = builder.prismaNode("ModelExport", {
  id: { field: "id" },
  fields: (t) => ({
    variableName: t.exposeString("variableName"),
    title: t.exposeString("title", { nullable: true }),
  }),
});

export const ModelExportConnection = builder.connectionObject({
  type: ModelExport,
  name: "ModelExportConnection",
});
