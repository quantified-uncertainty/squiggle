import { PRIMARY_SQUIGGLE_PACKAGE_DIRS } from "../constants.cjs";
import { generateWebsiteChangelog } from "../website.js";

// This script is useful on "New release" PR branches if you want to regenerate MDX changelog after editing changesets-generated CHANGELOG.md files manually.

async function main() {
  // Repo root.
  process.chdir("../..");

  // Generate MDX page for the upcoming release.
  await generateWebsiteChangelog(PRIMARY_SQUIGGLE_PACKAGE_DIRS);
}

main();
