import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

// Admin-only, for listing models in /admin/upgrade-versions UI
export async function loadModelsByVersion() {
  await checkRootUser();

  // no DTO but that's fine for admin-only
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

    groupedModels[version] ??= [];
    groupedModels[version].push(model);
    if (model.isPrivate) {
      privateStats[version] ??= 0;
      privateStats[version]++;
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
