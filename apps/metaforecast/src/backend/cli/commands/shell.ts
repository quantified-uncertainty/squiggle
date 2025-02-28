import { Command } from "@commander-js/extra-typings";
import { select, Separator } from "@inquirer/prompts";

import { rebuildFrontpage } from "@/backend/frontpage";
import { getPlatforms } from "@/backend/platformRegistry";
import { rebuildElasticDatabase } from "@/backend/utils/elastic";

import { processAll } from "./all";

export function addShellCommand(program: Command) {
  program
    .command("shell", { isDefault: true })
    .argument("[command]")
    .description("interactive shell")
    .action(async (command) => {
      // if command name would be known, it would be handled by other commands
      if (command) {
        throw new Error(`Command ${command} not found`);
      }

      const answer = await select({
        message: "Choose one option, wisely:",
        pageSize: 100,
        choices: [
          new Separator("─── Daily fetchers ───"),
          ...getPlatforms({ withDailyFetcherOnly: true }).map((platform) => ({
            name: platform.name,
            value: async () => {
              await program.parseAsync([platform.name]);
            },
          })),
          new Separator("─── Other commands ───"),
          {
            name: "Elastic",
            value: rebuildElasticDatabase,
          },
          {
            name: "Frontpage",
            value: rebuildFrontpage,
          },
          {
            name: "All",
            value: processAll,
          },
        ],
      });

      await answer();
      process.exit();
    });
}
