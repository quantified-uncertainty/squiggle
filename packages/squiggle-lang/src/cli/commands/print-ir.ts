import { Command } from "@commander-js/extra-typings";

import { compileAst } from "../../expression/compile.js";
import { expressionToString } from "../../expression/index.js";
import { getStdLib } from "../../library/index.js";
import { parse } from "../../public/parse.js";
import { red } from "../colors.js";
import { loadSrc } from "../utils.js";

export function addPrintIrCommand(program: Command) {
  program
    .command("print-ir")
    .arguments("[filename]")
    .option(
      "-e, --eval <code>",
      "process a given squiggle code string instead of a file"
    )
    .action((filename, options) => {
      const src = loadSrc({ program, filename, inline: options.eval });

      const parseResult = parse(src);
      if (parseResult.ok) {
        const expression = compileAst(parseResult.value.raw, getStdLib());

        if (expression.ok) {
          console.log(expressionToString(expression.value, { colored: true }));
        } else {
          console.log(red(expression.value.toString()));
        }
      } else {
        console.log(red(parseResult.value.toString()));
      }
    });
}
