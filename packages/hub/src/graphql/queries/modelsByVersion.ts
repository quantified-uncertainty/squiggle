import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { Model } from "../types/Model";

const ModelsByVersion = builder.simpleObject("ModelsByVersion", {
  fields: (t) => ({
    version: t.string(),
    count: t.int(),
    privateCount: t.int(),
    models: t.field({
      type: [Model],
    }),
  }),
});

builder.queryField("modelsByVersion", (t) =>
  t.field({
    description: "Admin-only query for listing models in /admin UI",
    type: [ModelsByVersion],
    authScopes: {
      isRootUser: true,
    },
    resolve: async () => {
      const models = await prisma.model.findMany({
        include: {
          currentRevision: {
            where: {
              contentType: "SquiggleSnippet",
            },
            include: {
              squiggleSnippet: true,
            },
          },
        },
      });

      const groupedModels: Record<string, typeof models> = {};
      const privateStats: Record<string, number> = {};
      const versions = new Set<string>();

      for (const model of models) {
        const version = model.currentRevision?.squiggleSnippet?.version;
        if (!version) continue;

        versions.add(version);

        if (model.isPrivate) {
          privateStats[version] ??= 0;
          privateStats[version]++;
        } else {
          // don't expose private models, they won't be available through GraphQL anyway
          groupedModels[version] ??= [];
          groupedModels[version].push(model);
        }
      }
      return [...versions.values()].map((version) => ({
        version,
        count: (groupedModels[version] ?? []).length,
        privateCount: privateStats[version] ?? 0,
        models: groupedModels[version] ?? [],
      }));
    },
  })
);
