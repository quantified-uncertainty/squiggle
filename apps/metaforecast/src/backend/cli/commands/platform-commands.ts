import { type Command } from "@commander-js/extra-typings";

import { getPlatforms } from "../../platformRegistry";
import { processPlatform } from "../../platformUtils";

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
