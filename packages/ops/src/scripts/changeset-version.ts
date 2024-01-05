import { cleanupGeneratedChangelogs } from "../changelog-cleanup.js";
import { exec } from "../lib.js";
import { updateSquiggleLangVersion } from "../patch-js.js";
import { generateWebsiteChangelog } from "../website.js";

async function main() {
  // Repo root.
  process.chdir("../..");

  // Call the original changeset.
  // `changeset version` will use our functions from `changelog.cts` to generate new CHANGELOG.md entries from changeset md files.
  await exec("npx changeset version");

  // `changeset` changelog format can be modified only on the level of individual changesets, so we have to patch the generated files.
  await cleanupGeneratedChangelogs();

  // Update `System.version` output in Squiggle.
  await updateSquiggleLangVersion();

  // Generate MDX page for the upcoming release.
  await generateWebsiteChangelog();
}

main();
