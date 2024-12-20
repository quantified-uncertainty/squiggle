import { exec } from "../lib.js";

async function main() {
  process.chdir("../..");
  await exec("npx turbo lint build");

  await exec("npx changeset publish");
  process.chdir("packages/vscode-ext");
  await exec("pnpm run package");
  await exec("npx vsce publish --no-dependencies --skip-duplicate");
  process.chdir("../..");
}

main();
