import fs from "fs";
import { OutputMode, run } from "./utils";

import { Command } from "@commander-js/extra-typings";
import open from "open";

export const makeProgram = () => {
  const program = new Command();

  program
    .command("run")
    .arguments("[filename]")
    .option(
      "-e, --eval <code>",
      "run a given squiggle code string instead of a file"
    )
    .option("-t --time", "output the time it took to evaluate the code")
    .option("-q, --quiet", "don't output the results and bindings") // useful for measuring the performance or checking that the code is valid
    .option(
      "-b, --show-bindings",
      "show bindings even if the result is present"
    ) // incompatible with --quiet
    .action((filename, options) => {
      let src = "";

      let output: OutputMode = "RESULT_OR_BINDINGS";
      if (options.quiet && options.showBindings) {
        program.error(
          "--quiet and --show-bindings can't be set at the same time."
        );
      } else if (options.quiet) {
        output = "NONE";
      } else if (options.showBindings) {
        output = "RESULT_AND_BINDINGS";
      }

      if (filename && options.eval) {
        program.error("Only one of filename and eval string should be set.");
      } else if (filename) {
        src = fs.readFileSync(filename, "utf-8");
      } else if (options.eval) {
        src = options.eval;
      } else {
        program.error("One of filename and eval string should be set.");
      }

      const sampleCount = process.env.SAMPLE_COUNT;

      run({ src, filename, output, measure: options.time, sampleCount });
    });

  program.command("playground").action(() => {
    open("https://www.squiggle-language.com/playground");
  });

  return program;
};

const main = async () => {
  await makeProgram().parseAsync();
};

if (require.main === module) {
  // running as script, https://stackoverflow.com/a/6398335
  main();
}
