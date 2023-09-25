import { exec as originalExec } from "node:child_process";
import util from "node:util";
import { PRIMARY_SQUIGGLE_PACKAGE_DIRS } from "../constants.js";

const exec = util.promisify(originalExec);

async function bumpVersionsToDev() {
  for (const packageDir of PRIMARY_SQUIGGLE_PACKAGE_DIRS) {
    process.chdir(packageDir);
    await exec("pnpm version prerelease");
    process.chdir("../..");
  }
}

async function main() {
  process.chdir("../.."); // TODO - detect current dir first
  await exec("turbo lint build");
  // await exec("changeset publish");
  process.chdir("packages/vscode-ext");
  await exec("pnpm run package");
  // await exec("npx vsce publish --no-dependencies --skip-duplicate");

  process.chdir("../..");
  await bumpVersionsToDev();
}

main();
