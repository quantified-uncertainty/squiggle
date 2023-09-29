import escapeRegExp from "lodash/escapeRegExp.js";
import { readFile, writeFile } from "node:fs/promises";

import { PRIMARY_SQUIGGLE_PACKAGE_DIRS } from "../constants.js";
import { PackageInfo, exec, exists, getPackageInfo } from "../lib.js";

async function insertVersionToVersionedPlayground(version: string) {
  process.chdir("packages/versioned-playground");

  const alias = `squiggle-components-${version}`;
  await exec(`pnpm add ${alias}@npm:@quri/squiggle-components@${version}`);

  {
    const componentFilename = "src/VersionedSquigglePlayground.tsx";
    let playgroundComponent = await readFile(componentFilename, "utf-8");

    // new RegExp is important! not sure why, it's not necessary for match(), but necessary for replace(), JS is weird
    const regex = new RegExp(escapeRegExp("dev: lazy(async () => ({"));
    if (!playgroundComponent.match(regex)) {
      throw new Error("Can't find lazy load declarations to patch");
    }
    playgroundComponent = playgroundComponent.replace(
      regex,
      `"${version}": lazy(async () => ({
    default: (await import("${alias}")).SquigglePlayground,
  })),
  $&`
    );
    await writeFile(componentFilename, playgroundComponent, "utf-8");
  }

  {
    const versionsFilename = "src/versions.ts";
    let versionsCode = await readFile(versionsFilename, "utf-8");

    const versionsRegex = new RegExp(
      escapeRegExp("export const squiggleVersions = [")
    );
    if (!versionsCode.match(versionsRegex)) {
      throw new Error("Can't find versions string");
    }
    versionsCode = versionsCode.replace(versionsRegex, `$&"${version}", `);

    const defaultVersionRegex =
      /(export const defaultSquiggleVersion: SquiggleVersion = ")[^"]+/;
    if (!versionsCode.match(defaultVersionRegex)) {
      throw new Error("Can't find default version string");
    }
    versionsCode = versionsCode.replace(defaultVersionRegex, `$1${version}`);
    await writeFile(versionsFilename, versionsCode, "utf-8");
  }

  // TODO - run `pnpm format` to make sure we didn't break prettier?

  process.chdir("../..");
}

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

  // We have to do things in this order, because attempt to `pnpm add` a version to versioned-playground results in a local workspace: dependency
  // so we cache an old version first, then bump all package versions, and only then update versioned-playground
  const { version: releasedVersion } = await getPackageInfo(
    PRIMARY_SQUIGGLE_PACKAGE_DIRS[0]
  );
  await bumpVersionsToDev();
  await insertVersionToVersionedPlayground(releasedVersion);

  await exec("cd packages/squiggle-lang && pnpm run update-system-version");

  await createEmptyChangeset();
}

main();
