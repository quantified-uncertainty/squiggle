import { writeFile } from "node:fs/promises";

import { PRIMARY_SQUIGGLE_PACKAGE_DIRS } from "../constants.cjs";
import { exec, exists } from "../lib.js";
import { getPackageInfo, PackageInfo } from "../package-utils.js";
import {
  insertVersionToVersionedComponents,
  updateSquiggleLangVersion,
} from "../patch-js.js";

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
  process.chdir("../..");

  // We have to do things in this order, because attempt to `pnpm add` a version to versioned-components results in a local workspace: dependency
  // so we cache an old version first, then bump all package versions, and only then update versioned-components
  const { version: releasedVersion } = await getPackageInfo(
    PRIMARY_SQUIGGLE_PACKAGE_DIRS[0]
  );
  await bumpVersionsToDev();

  await insertVersionToVersionedComponents(releasedVersion);

  await updateSquiggleLangVersion();

  await createEmptyChangeset();
}

main();
