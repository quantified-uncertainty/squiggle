import { Command } from "@commander-js/extra-typings";

export function addPlaygroundCommand(program: Command) {
  program.command("playground").action(() => {
    open("https://www.squiggle-language.com/playground");
  });
}
