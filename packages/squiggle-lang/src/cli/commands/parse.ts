import { Command, Option } from "@commander-js/extra-typings";

import { typedAstNodeToString } from "../../analysis/toString.js";
import { astNodeToString } from "../../ast/parse.js";
import { SqModule } from "../../public/SqProject/SqModule.js";
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
    .addOption(
      new Option("-m, --mode <mode>")
        .choices(["default", "typed", "raw"] as const)
        .default("default" as const)
    )
    .action((filename, options) => {
      const src = loadSrc({ program, filename, inline: options.eval });

      const module = new SqModule({
        name: filename ?? "<eval>",
        code: src,
      });

      switch (options.mode) {
        case "default": {
          const ast = module.ast();
          if (ast.ok) {
            console.log(astNodeToString(ast.value, { colored: true }));
          } else {
            console.log(red(ast.value.toString()));
          }
          break;
        }
        case "raw": {
          const ast = module.ast();
          if (ast.ok) {
            console.log(coloredJson(ast.value));
          } else {
            console.log(red(ast.value.toString()));
          }
          break;
        }
        case "typed": {
          const typedAst = module.typedAst();
          if (typedAst.ok) {
            console.log(
              typedAstNodeToString(typedAst.value, {
                colored: true,
                withTypes: true,
              })
            );
          } else {
            console.log(red(typedAst.value.toString()));
          }
          break;
        }
        default:
          throw new Error(`Unknown mode: ${options.mode satisfies never}`);
      }
    });
}
