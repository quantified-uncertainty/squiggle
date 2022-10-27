import fs from "fs";
import { run } from "./utils";

import { program } from "@commander-js/extra-typings";
import open from "open";

program
  .command("run")
  .arguments("[filename]")
  .option(
    "-e, --eval <code>",
    "run a given squiggle code string instead of a file"
  )
  .option("-m --measure", "output the time it took to evaluate the code")
  .option("-q, --quiet", "don't output the results and bindings")
  .action((filename, options) => {
    let src = "";

    if (filename) {
      if (options.eval) {
        program.error("Only one of filename and eval string should be set.");
      }
      src = fs.readFileSync(filename, "utf-8");
    } else {
      if (options.eval) {
        src = options.eval;
      } else {
        program.error("One of filename and eval string should be set.");
      }
    }

    const sampleCount = process.env.SAMPLE_COUNT;

    run(src, { output: !options.quiet, measure: options.measure, sampleCount });
  });

program.command("playground").action(() => {
  open("https://www.squiggle-language.com/playground");
});

const main = async () => {
  await program.parseAsync();
};

main();
