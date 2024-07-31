import { Command } from "@commander-js/extra-typings";

import { compileAst } from "../../compiler/index.js";
import { irToString } from "../../compiler/toString.js";
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
        // TODO - use a linker and higher-level SqProject APIs
        const ir = compileAst({ ast: parseResult.value, imports: {} });

        if (ir.ok) {
          console.log(irToString(ir.value, { colored: true }));
        } else {
          console.log(red(ir.value.toString()));
        }
      } else {
        console.log(red(parseResult.value.toString()));
      }
    });
}
