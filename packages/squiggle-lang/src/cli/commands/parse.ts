import { Command } from "@commander-js/extra-typings";

import { nodeResultToString } from "../../analysis/toString.js";
import { parse } from "../../public/parse.js";
import { red } from "../colors.js";
import { coloredJson, loadSrc } from "../utils.js";

export function addParseCommand(program: Command) {
  program
    .command("parse")
    .arguments("[filename]")
    .option(
      "-e, --eval <code>",
      "parse a given squiggle code string instead of a file"
    )
    .option("-r, --raw", "output as JSON")
    .action((filename, options) => {
      const src = loadSrc({ program, filename, inline: options.eval });

      const parseResult = parse(src);
      if (parseResult.ok) {
        if (options.raw) {
          console.log(coloredJson(parseResult.value.raw));
        } else {
          console.log(nodeResultToString(parseResult, { colored: true }));
        }
      } else {
        console.log(red(parseResult.value.toString()));
      }
    });
}
