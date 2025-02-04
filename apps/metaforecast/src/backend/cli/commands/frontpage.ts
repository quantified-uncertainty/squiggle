import { Command } from "@commander-js/extra-typings";

import { rebuildFrontpage } from "@/backend/frontpage";

export function addFrontpageCommand(program: Command) {
  program
    .command("frontpage")
    .description("rebuild frontpage")
    .action(async () => {
      await rebuildFrontpage();
    });
}
