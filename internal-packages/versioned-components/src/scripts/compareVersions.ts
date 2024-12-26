import { Command } from "@commander-js/extra-typings";

import { compareVersions } from "../compareVersions.js";
import { checkSquiggleVersion } from "../versions.js";

export function makeProgram() {
  const program = new Command();

  program
    .requiredOption("--v1 <version>", "version 1")
    .requiredOption("--v2 <version>", "version 2")
    .requiredOption("--code <code>", "code to run")
    .action(async (options) => {
      const { v1, v2, code } = options;

      if (!checkSquiggleVersion(v1)) {
        program.error(`Invalid version: ${v1}`);
        return;
      }
      if (!checkSquiggleVersion(v2)) {
        program.error(`Invalid version: ${v2}`);
        return;
      }

      const diff = await compareVersions({ version1: v1, version2: v2, code });

      if (!diff) {
        console.log("Code output is identical");
      } else {
        console.log(JSON.stringify(diff, null, 2));
      }
    });

  return program;
}

async function main() {
  await makeProgram().parseAsync();
}

main();
