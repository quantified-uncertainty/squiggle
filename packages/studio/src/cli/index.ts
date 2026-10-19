import { Command } from "@commander-js/extra-typings";

import { register as registerRender } from "./commands/render.js";
import { register as registerRun } from "./commands/run.js";
import { register as registerRv } from "./commands/rv.js";
import { register as registerServe } from "./commands/serve.js";

const program = new Command()
  .name("squiggle-studio")
  .description("Edit and view .squiggle files in your browser.");

// `serve` is the default command: it defines the program's own [dir] argument,
// options and action. The others add subcommands.
registerServe(program);
registerRender(program);
registerRun(program);
registerRv(program);

program.parseAsync().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
