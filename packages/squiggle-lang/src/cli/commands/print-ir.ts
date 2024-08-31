import { Command } from "@commander-js/extra-typings";

import { compileTypedAst } from "../../compiler/index.js";
import { irToString } from "../../compiler/toString.js";
import { SqModule } from "../../public/SqProject/SqModule.js";
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

      const module = new SqModule({
        name: filename ?? "<eval>",
        code: src,
      });

      const typedAstR = module.typedAst();
      if (typedAstR.ok) {
        // TODO - use a linker and higher-level SqProject APIs
        const ir = compileTypedAst({ ast: typedAstR.value, imports: {} });

        if (ir.ok) {
          console.log(irToString(ir.value, { colored: true }));
        } else {
          console.log(red(ir.value.toString()));
        }
      } else {
        console.log(red(typedAstR.value.toString()));
      }
    });
}
