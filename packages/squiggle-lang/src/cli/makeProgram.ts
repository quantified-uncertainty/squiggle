import { Command } from "@commander-js/extra-typings";

import { addParseCommand } from "./commands/parse.js";
import { addPlaygroundCommand } from "./commands/playground.js";
import { addPrintIrCommand } from "./commands/print-ir.js";
import { addRunCommand } from "./commands/run.js";

export function makeProgram() {
  const program = new Command();

  addRunCommand(program);
  addParseCommand(program);
  addPrintIrCommand(program);
  addPlaygroundCommand(program);

  return program;
}
