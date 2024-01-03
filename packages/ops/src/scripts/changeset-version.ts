import { toString as mdastToString } from "mdast-util-to-string";
import { exec as originalExec } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import util from "node:util";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

import {
  PRIMARY_SQUIGGLE_PACKAGE_DIRS,
  VSCODE_EXTENSION_URL,
  VSCODE_PACKAGE_NAME,
  WEBSITE_CHANGELOG_ROOT,
} from "../constants.js";
import { getPackageInfo, PackageInfo } from "../lib.js";

const exec = util.promisify(originalExec);

async function getChangedPackages() {
  const { stdout } = await exec("git status -s");

  const packageDirs: string[] = [];
  for (const line of stdout.split("\n")) {
    const filename = line.split(" ").at(-1);
    if (filename?.endsWith("CHANGELOG.md")) {
      const packageRoot = filename.replace(/\/CHANGELOG\.md$/, "");
      packageDirs.push(packageRoot);
    }
  }
  return packageDirs;
}

// Based on https://github.com/changesets/action/blob/2bb9bcbd6bf4996a55ce459a630a0aa699457f59/src/utils.ts;
// heavily modified.
function getChangelogEntry(changelog: string, version: string) {
  const ast = unified().use(remarkParse).parse(changelog);

  const nodes = ast.children;
  let startedDepth: number | null = null;

  const pickedNodes: typeof nodes = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "heading") {
      if (startedDepth && node.depth === startedDepth) {
        break;
      }
      const stringified: string = mdastToString(node);
      if (!startedDepth && stringified === version) {
        startedDepth = node.depth;
        continue;
      }
      if (!startedDepth) {
        continue;
      }
    }

    pickedNodes.push(node);
  }

  if (!startedDepth) {
    throw new Error(`Couldn't find ${version} entry`); // TODO - would be useful to output file name too
  }
  ast.children = pickedNodes;

  return {
    content: (unified().use(remarkStringify).stringify(ast) as string).trim(),
  };
}

type PackageChangelog = {
  packageDir: string;
  packageInfo: PackageInfo;
  changes: string;
};

function changelogFile(packageDir: string) {
  return `${packageDir}/CHANGELOG.md`;
}

async function getChangelogText(packageDir: string) {
  return await readFile(changelogFile(packageDir), "utf-8");
}

async function updateChangelogText(packageDir: string, text: string) {
  return await writeFile(changelogFile(packageDir), text, "utf-8");
}

async function generatePackageChanges(
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

async function generateWebsiteChangelog() {
  const packageDirs = await getChangedPackages();

  const allChangelogs: PackageChangelog[] = [];

  for (const packageDir of packageDirs) {
    const changelog = await generatePackageChanges(packageDir);
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

async function cleanupUselessHeadersInPackage(packageDir: string) {
  const changelog = await getChangelogText(packageDir);
  const ast = unified().use(remarkParse).parse(changelog);

  ast.children = ast.children.filter((node) => {
    if (
      node.type === "heading" &&
      mdastToString(node).match(/(Major|Minor|Patch) Changes/) !== null
    ) {
      return false;
    }
    return true;
  });

  await updateChangelogText(
    packageDir,
    (unified().use(remarkStringify).stringify(ast) as string).trim()
  );
}

async function cleanupUselessHeaders() {
  const packageDirs = await getChangedPackages();
  for (const packageDir of packageDirs) {
    await cleanupUselessHeadersInPackage(packageDir);
  }
}

async function main() {
  process.chdir("../.."); // repo root
  await exec("npx changeset version");
  await cleanupUselessHeaders();
  await exec("cd packages/squiggle-lang && pnpm run update-system-version");

  await generateWebsiteChangelog();
}

main();
