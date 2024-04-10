import merge from "lodash/merge";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { modelWhereHasAccess } from "../helpers/modelHelpers";
import { ModelExport, ModelExportConnection } from "../types/ModelExport";

const ModelExportQueryInput = builder.inputType("ModelExportQueryInput", {
  fields: (t) => ({
    modelId: t.string(),
    variableName: t.string(),
    owner: t.string(),
  }),
});

builder.queryField("modelExports", (t) =>
  t.prismaConnection(
    {
      type: ModelExport,
      cursor: "id",
      args: {
        input: t.arg({ type: ModelExportQueryInput }),
      },
      resolve: (query, _, { input }, { session }) => {
        const modelId = input?.modelId;

        const queries = merge(
          {},
          { modelRevision: { model: modelWhereHasAccess(session) } },
          modelId && {
            modelRevision: {
              modelId: modelId,
            },
          },
          input?.owner && {
            modelRevision: { model: { owner: { slug: input.owner } } },
          },
          input &&
            input.variableName && {
              variableName: input.variableName,
            }
        );

        return prisma.modelExport.findMany({
          ...query,
          where: {
            ...queries,
            isCurrent: true,
          },
          orderBy: {
            modelRevision: {
              createdAt: "desc",
            },
          },
        });
      },
    },
    ModelExportConnection
  )
);
