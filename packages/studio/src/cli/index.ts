import fs from "node:fs";
import path from "node:path";

import { Command, CommanderError } from "@commander-js/extra-typings";
import { z } from "zod";

import { StudioUsageError } from "../server/runner.js";
import { EXIT } from "./args.js";
import { register as registerRender } from "./commands/render.js";
import { register as registerRun } from "./commands/run.js";
import { register as registerRv } from "./commands/rv.js";
import { register as registerServe } from "./commands/serve.js";

// The package's version, from package.json (two levels up from both
// src/cli/index.ts and dist/cli/index.js).
function studioVersion(): string {
  const file = path.resolve(import.meta.dirname, "..", "..", "package.json");
  return z
    .object({ version: z.string() })
    .parse(JSON.parse(fs.readFileSync(file, "utf-8"))).version;
}

function makeProgram(): Command {
  const program = new Command()
    .name("squiggle-studio")
    .description(
      "Edit and view .squiggle files in your browser. For agents: `run`, `rv` and `render` print values, matrices and PNGs without a running Studio."
    )
    .version(studioVersion(), "-V, --version", "print the version")
    // `help` and `help <command>`: commander adds a help command only for
    // programs without an action of their own, and `serve` is the default.
    .helpCommand("help [command]", "show help for a command");

  // `serve` is the default command: it defines the program's own [dir]
  // argument, options and action. The others add subcommands.
  registerServe(program);
  registerRender(program);
  registerRun(program);
  registerRv(program);

  // Usage errors (unknown options, bad option values, missing arguments)
  // exit with 2, like a StudioUsageError; help and --version with 0.
  for (const command of [program, ...program.commands]) {
    command.exitOverride();
  }
  return program;
}

async function main(): Promise<void> {
  try {
    await makeProgram().parseAsync();
  } catch (e) {
    if (e instanceof CommanderError) {
      // Commander has already printed the message (or the help).
      process.exit(e.exitCode === 0 ? EXIT.ok : EXIT.usage);
    }
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(e instanceof StudioUsageError ? EXIT.usage : 1);
  }
}

await main();
