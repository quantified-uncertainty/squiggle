import "dotenv/config";

import { Command } from "@commander-js/extra-typings";

import { addAllCommand } from "./commands/all";
import { addElasticCommand } from "./commands/elastic";
import { addFrontpageCommand } from "./commands/frontpage";
import { addPlatformCommands } from "./commands/platform-commands";
import { addShellCommand } from "./commands/shell";

function makeProgram() {
  const program = new Command();

  addPlatformCommands(program);
  addElasticCommand(program);
  addFrontpageCommand(program);
  addAllCommand(program);

  addShellCommand(program);

  return program;
}

function main() {
  const program = makeProgram();
  program.parse();
}

main();
