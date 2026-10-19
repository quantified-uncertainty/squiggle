import { Command } from "@commander-js/extra-typings";
import open from "open";

export const PLAYGROUND_URL = "https://www.squiggle-language.com/playground";

export function addPlaygroundCommand(program: Command) {
  program
    .command("playground")
    .description("Open the online Squiggle playground in a browser")
    .option("--print-url", "print the playground URL instead of opening it")
    .action(async (options) => {
      if (options.printUrl) {
        console.log(PLAYGROUND_URL);
        return;
      }
      await open(PLAYGROUND_URL);
      console.log(`Opened ${PLAYGROUND_URL}`);
    });
}
