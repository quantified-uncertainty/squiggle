import "server-only";

import { prisma } from "@/prisma";
import { checkRootUser } from "@/server/users/auth";

// Admin-only, for listing models in /admin UI
export async function loadModelsByVersion() {
  await checkRootUser();

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
      owner: true,
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
      // don't expose private models, they won't be available for loading anyway
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
}

export type ModelByVersion = Awaited<
  ReturnType<typeof loadModelsByVersion>
>[number];
