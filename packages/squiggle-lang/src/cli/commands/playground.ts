import { Command } from "@commander-js/extra-typings";
import open from "open";

export function addPlaygroundCommand(program: Command) {
  program.command("playground").action(async () => {
    await open("https://www.squiggle-language.com/playground");
  });
}
