import { readFile, writeFile } from "fs/promises";

import { getChangelogEntry, getChangelogText } from "./changelog-utils.js";
import {
  PRIMARY_SQUIGGLE_PACKAGE_DIRS,
  VSCODE_EXTENSION_URL,
  VSCODE_PACKAGE_NAME,
  WEBSITE_CHANGELOG_ROOT,
} from "./constants.cjs";
import {
  getChangedPackages,
  getPackageInfo,
  PackageInfo,
} from "./package-utils.js";

export type PackageChangelog = {
  packageDir: string;
  packageInfo: PackageInfo;
  changes: string;
};

async function getPackageChanges(
  packageDir: string
): Promise<PackageChangelog> {
  const packageInfo = await getPackageInfo(packageDir);
  const changelog = await getChangelogText(packageDir);
  const changelogEntry = getChangelogEntry(changelog, packageInfo.version);
  return { packageDir, packageInfo, changes: changelogEntry.content };
}

function combineChangelogs(changelogs: PackageChangelog[]): {
  content: string;
  version: string;
} {
  const version = changelogs[0].packageInfo.version;

  let content = `## ${version}\n\n`;

  for (const packageDir of PRIMARY_SQUIGGLE_PACKAGE_DIRS) {
    const changelog = changelogs.find(
      (changelog) => changelog.packageDir === packageDir
    );
    if (!changelog) continue;

    const packageName = changelog.packageInfo.name;

    const link =
      packageName === VSCODE_PACKAGE_NAME
        ? VSCODE_EXTENSION_URL
        : `https://www.npmjs.com/package/${packageName}`;

    content += `### [${packageName}](${link})\n\n`;
    content += (changelog.changes || "_No changes._") + "\n\n";
  }

  return {
    content,
    version,
  };
}

async function updateChangelogMeta(version: string) {
  const metaFilename = `${WEBSITE_CHANGELOG_ROOT}/_meta.json`;

  const metaJson = JSON.parse(await readFile(metaFilename, "utf-8"));
  const versionName = `v${version}`;
  await writeFile(
    metaFilename,
    JSON.stringify({
      [versionName]: versionName,
      ...metaJson,
    })
  );
}
export async function generateWebsiteChangelog() {
  const packageDirs = await getChangedPackages();

  const allChangelogs: PackageChangelog[] = [];

  for (const packageDir of packageDirs) {
    const changelog = await getPackageChanges(packageDir);
    if (PRIMARY_SQUIGGLE_PACKAGE_DIRS.includes(packageDir)) {
      allChangelogs.push(changelog);
    }
  }
  if (!allChangelogs.length) {
    return;
  }
  const fullChangelog = combineChangelogs(allChangelogs);

  await writeFile(
    `${WEBSITE_CHANGELOG_ROOT}/v${fullChangelog.version}.mdx`,
    fullChangelog.content
  );

  await updateChangelogMeta(fullChangelog.version);
}
