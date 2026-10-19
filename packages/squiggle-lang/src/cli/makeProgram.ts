import { Command } from "@commander-js/extra-typings";

import { addCheckCommand } from "./commands/check.js";
import { addDocsCommand } from "./commands/docs.js";
import { addParseCommand } from "./commands/parse.js";
import { addPlaygroundCommand } from "./commands/playground.js";
import { addPrintIrCommand } from "./commands/print-ir.js";
import { addRunCommand } from "./commands/run.js";

export function makeProgram() {
  const program = new Command();

  program
    .name("squiggle")
    .description(
      "Squiggle: a language for probabilistic estimation. Run models, check them for errors, and look up builtin docs."
    )
    .addHelpText(
      "after",
      `
Examples:
  $ squiggle run model.squiggle               # evaluate a file, print the result
  $ squiggle run -e "2 to 10" --json          # machine-readable output (dists summarized)
  $ squiggle check model.squiggle --json      # errors + hints + warnings, without running
  $ squiggle docs Dist.normal                 # signatures and examples for a builtin
  $ squiggle docs --list                      # all builtin namespaces

Run \`squiggle <command> --help\` for command options.`
    );

  addRunCommand(program);
  addCheckCommand(program);
  addDocsCommand(program);
  addParseCommand(program);
  addPrintIrCommand(program);
  addPlaygroundCommand(program);

  return program;
}
