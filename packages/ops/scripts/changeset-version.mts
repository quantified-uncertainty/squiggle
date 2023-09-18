import { exec as originalExec } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import util from "node:util";

import remarkParse from "remark-parse";
import { type Root } from "remark-parse/lib/index.js";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { toString as mdastToString } from "mdast-util-to-string";

const exec = util.promisify(originalExec);

const WEBSITE_CHANGELOG_ROOT = "packages/website/src/pages/docs/Changelog";

// versions of all these packages should be synced thanks to `fixed` field in `.changeset/config.json`
const WEBSITE_CHANGELOG_PACKAGES = [
  "@quri/squiggle-lang",
  "@quri/squiggle-components",
  "@quri/prettier-plugin-squiggle",
  "vscode-squiggle",
];

async function getChangedPackages() {
  const { stdout } = await exec("git status -s");

  const packageDirs: string[] = [];
  for (const line of stdout.split("\n")) {
    const filename = line.split(" ").at(1);
    if (filename?.endsWith("CHANGELOG.md")) {
      const packageRoot = filename.replace(/\/CHANGELOG\.md$/, "");
      packageDirs.push(packageRoot);
    }
  }
  return packageDirs;
}

// based on https://github.com/changesets/action/blob/2bb9bcbd6bf4996a55ce459a630a0aa699457f59/src/utils.ts
//  heavily modified
function getChangelogEntry(changelog: string, version: string) {
  // unified types and versions are currently a mess, might get better in a few months
  // @ts-expect-error
  const ast: Root = unified().use(remarkParse).parse(changelog);

  const nodes = ast.children;
  let started = false;

  const pickedNodes: typeof nodes = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "heading") {
      const stringified: string = mdastToString(node);
      if (!started && stringified === version) {
        started = true;
        continue;
      }
      if (!started) {
        continue;
      }
      if (stringified.match(/(Major|Minor|Patch) Changes/) !== null) {
        continue; // these headers are noise, skip
      }
    }

    pickedNodes.push(node);
  }

  if (!started) {
    throw new Error(`Couldn't find ${version} entry`); // TODO - would be useful to output file name too
  }
  ast.children = pickedNodes;

  return {
    // @ts-expect-error
    content: (unified().use(remarkStringify).stringify(ast) as string).trim(),
  };
}

type PackageInfo = {
  version: string;
  name: string;
};

async function getPackageInfo(packageDir: string): Promise<PackageInfo> {
  const packageJson = JSON.parse(
    await readFile(`${packageDir}/package.json`, "utf-8")
  );
  return { version: packageJson.version, name: packageJson.name }; // TODO: zod
}

type PackageChangelog = {
  packageDir: string;
  packageInfo: PackageInfo;
  changes: string;
};

async function generatePackageChanges(
  packageDir: string
): Promise<PackageChangelog> {
  const packageInfo = await getPackageInfo(packageDir);
  const changelog = await readFile(`${packageDir}/CHANGELOG.md`, "utf-8");
  const changelogEntry = getChangelogEntry(changelog, packageInfo.version);
  return { packageDir, packageInfo, changes: changelogEntry.content };
}

function combineChangelogs(changelogs: PackageChangelog[]): {
  content: string;
  version: string;
} {
  const version = changelogs[0].packageInfo.version;

  let content = `## ${version}\n\n`;

  for (const packageName of WEBSITE_CHANGELOG_PACKAGES) {
    const changelog = changelogs.find(
      (changelog) => changelog.packageInfo.name === packageName
    );
    if (!changelog) continue;
    content += `### [${changelog.packageInfo.name}](https://www.npmjs.com/package/${changelog.packageInfo.name})\n\n`;
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
    if (WEBSITE_CHANGELOG_PACKAGES.includes(changelog.packageInfo.name)) {
      allChangelogs.push(changelog);
    }
  }
  const fullChangelog = combineChangelogs(allChangelogs);

  await writeFile(
    `${WEBSITE_CHANGELOG_ROOT}/v${fullChangelog.version}.mdx`,
    fullChangelog.content
  );

  await updateChangelogMeta(fullChangelog.version);
}

async function main() {
  process.chdir("../.."); // repo root
  await exec("npx changeset version");

  await generateWebsiteChangelog();
}

main();
