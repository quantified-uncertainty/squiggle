import fs from "fs";
import util from "util";
import { OutputMode, run } from "./utils.js";

import { Command } from "@commander-js/extra-typings";
import open from "open";
import { parse } from "../public/parse.js";
import { red } from "./colors.js";

export function makeProgram() {
  const program = new Command();

  const loadSrc = ({
    filename,
    inline,
  }: {
    filename: string | undefined;
    inline: string | undefined;
  }) => {
    let src = "";
    if (filename !== undefined && inline !== undefined) {
      program.error("Only one of filename and eval string should be set.");
    } else if (filename !== undefined) {
      src = fs.readFileSync(filename, "utf-8");
    } else if (inline !== undefined) {
      src = inline;
    } else {
      program.error("One of filename and eval string should be set.");
    }
    return src;
  };

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
    .action(async (filename, options) => {
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

      const src = loadSrc({ filename, inline: options.eval });

      const sampleCount = process.env["SAMPLE_COUNT"];

      await run({ src, filename, output, measure: options.time, sampleCount });
    });

  program
    .command("parse")
    .arguments("[filename]")
    .option(
      "-e, --eval <code>",
      "parse a given squiggle code string instead of a file"
    )
    .action((filename, options) => {
      const src = loadSrc({ filename, inline: options.eval });

      const parseResult = parse(src);
      if (parseResult.ok) {
        console.log(
          util.inspect(parseResult.value, { depth: Infinity, colors: true })
        );
      } else {
        console.log(red(parseResult.value.toString()));
      }
    });

  program.command("playground").action(() => {
    open("https://www.squiggle-language.com/playground");
  });

  return program;
}
