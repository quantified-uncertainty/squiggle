import { exec as originalExec } from "node:child_process";
import { writeFile } from "node:fs/promises";
import util from "node:util";
import { PRIMARY_SQUIGGLE_PACKAGE_DIRS } from "../constants.js";
import { PackageInfo, exists, getPackageInfo } from "../lib.js";

const exec = util.promisify(originalExec);

async function bumpVersionsToDev() {
  for (const packageDir of PRIMARY_SQUIGGLE_PACKAGE_DIRS) {
    process.chdir(packageDir);
    await exec("pnpm version prerelease");
    process.chdir("../..");
  }
}

// necessary to block the subsequent automatic release
async function createEmptyChangeset() {
  const filename = ".changeset/next-release.md";
  if (await exists(filename)) {
    throw new Error("next-release.md already exists");
  }

  const packages: PackageInfo[] = [];
  for (const dir of PRIMARY_SQUIGGLE_PACKAGE_DIRS) {
    packages.push(await getPackageInfo(dir));
  }

  const content =
    "---\n" +
    packages.map((packageInfo) => `"${packageInfo.name}": patch\n`).join("") +
    "---\n";
  await writeFile(filename, content);
}

async function main() {
  process.chdir("../.."); // TODO - detect current dir first
  await exec("npx turbo lint build");

  // await exec("npx changeset publish");
  process.chdir("packages/vscode-ext");
  await exec("pnpm run package");
  // await exec("npx vsce publish --no-dependencies --skip-duplicate");

  process.chdir("../..");
  await bumpVersionsToDev();

  await exec("cd packages/squiggle-lang && pnpm run update-system-version");

  await createEmptyChangeset();
}

main();
