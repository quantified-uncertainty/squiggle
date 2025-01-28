import { type Command } from "@commander-js/extra-typings";

import { getPlatforms } from "../../platforms/registry";
import { processPlatform } from "../../robot";

export function addPlatformCommands(program: Command) {
  for (const platform of getPlatforms()) {
    const command = program
      .command(platform.name)
      .description(`download predictions from ${platform.name}`)
      .action(async () => {
        await processPlatform(platform);
      });

    platform.extendCliCommand?.(command);
  }
}
