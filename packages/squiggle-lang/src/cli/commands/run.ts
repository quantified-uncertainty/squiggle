import { Command, Option } from "@commander-js/extra-typings";
import { promises as fs } from "fs";
import isFinite from "lodash/isFinite.js";
import path from "path";

import { defaultEnv, Env } from "../../dists/env.js";
import { SqOutputResult } from "../../index.js";
import { SqLinker } from "../../public/SqLinker.js";
import { SqProject2 } from "../../public/SqProject2/index.js";
import { UnresolvedModule } from "../../public/SqProject2/UnresolvedModule.js";
import { allRunnerNames, runnerByName } from "../../runners/index.js";
import { CliPrinter } from "../CliPrinter.js";
import { bold, red } from "../colors.js";
import { debugLog, loadSrc, myParseInt } from "../utils.js";

type OutputMode = "NONE" | "RESULT_OR_BINDINGS" | "RESULT_AND_BINDINGS";

type RunArgs = {
  src: string;
  filename?: string;
  output: OutputMode;
  measure?: boolean;
  sampleCount?: string | number;
  seed?: string;
  profile?: boolean;
  runner?: Parameters<typeof runnerByName>[0];
  runnerThreads?: number;
  logEvents?: boolean;
};

const EVAL_SOURCE_ID = "[eval]";

function getLinker(params: {
  seed: string; // we use a fixed seed for all sources, since we don't have a way to store per-source seed in the file system yet
}): SqLinker {
  const linker: SqLinker = {
    resolve(name, fromId) {
      if (!name.startsWith("./") && !name.startsWith("../")) {
        throw new Error("Only relative paths in imports are allowed");
      }
      const dir =
        fromId === EVAL_SOURCE_ID ? process.cwd() : path.dirname(fromId);
      return path.resolve(dir, name);
    },
    async loadSource(sourceId) {
      return await fs.readFile(sourceId, "utf-8");
    },
    async loadModule(sourceId, hash) {
      if (hash) {
        throw new Error("Hashes are not supported");
      }
      const code = await linker.loadSource(sourceId);
      return new UnresolvedModule({
        name: sourceId,
        code,
        linker,
      });
    },
  };
  return linker;
}

async function _run(
  args: Pick<
    RunArgs,
    "src" | "filename" | "runner" | "runnerThreads" | "logEvents"
  > & {
    environment: Env;
  }
) {
  const linker = getLinker({ seed: args.environment.seed });
  const rootSource = new UnresolvedModule({
    name: args.filename ?? EVAL_SOURCE_ID,
    code: args.src,
    linker,
  });
  const runner = args.runner
    ? runnerByName(args.runner, args.runnerThreads ?? 1)
    : undefined;

  const project = new SqProject2({
    rootSource,
    linker,
    runner,
    environment: args.environment,
  });

  if (args.logEvents) {
    project.addEventListener("action", (e) => {
      debugLog(e.data.type, JSON.stringify(e.data.payload));
    });
  }

  const started = new Date();
  return new Promise<{ output: SqOutputResult; time: number }>(
    (resolve, reject) => {
      project.addEventListener("output", (e) => {
        if (e.data.output.module.module === rootSource) {
          const output = project.getOutput();
          if (output) {
            const time = (new Date().getTime() - started.getTime()) / 1000;
            resolve({ output, time });
          } else {
            reject(new Error("Output is not set"));
          }
        }
      });
    }
  );
}

async function run(args: RunArgs) {
  const environment: Env = {
    ...(args.sampleCount && isFinite(Number(args.sampleCount))
      ? {
          sampleCount: Number(args.sampleCount),
          xyPointLength: Number(args.sampleCount),
        }
      : {
          sampleCount: defaultEnv.sampleCount,
          xyPointLength: defaultEnv.xyPointLength,
        }),
    seed: args.seed || "default-seed",
    profile: args.profile ?? false,
  };

  const { output, time } = await _run({
    src: args.src,
    filename: args.filename,
    environment,
    runner: args.runner,
    runnerThreads: args.runnerThreads,
    logEvents: args.logEvents,
  });

  const printer = new CliPrinter();
  if (!output.ok) {
    printer.printSection(
      red("Error:"),
      output.value.toStringWithDetails(/* project */ undefined)
    );
  } else {
    switch (args.output) {
      case "RESULT_OR_BINDINGS":
        if (output.value.result.tag === "Void") {
          printer.printSection(output.value.bindings.toString());
        } else {
          printer.printSection(output.value.result.toString());
        }
        break;
      case "RESULT_AND_BINDINGS":
        printer.printSection(bold("Result:"), output.value.result.toString());
        printer.printSection(
          bold("Bindings:"),
          output.value.bindings.toString()
        );
        break;
      case "NONE":
      // do nothing
    }
  }

  if (args.measure) {
    printer.printSection(`${bold("Time:")} ${time}s`);
  }
}

export function addRunCommand(program: Command) {
  program
    .command("run")
    .arguments("[filename]")
    .option(
      "-e, --eval <code>",
      "run a given squiggle code string instead of a file"
    )
    .option("-t --time", "output the time it took to evaluate the code")
    .option("-p --profile", "performance profiler")
    .option("-q, --quiet", "don't output the results and bindings") // useful for measuring the performance or checking that the code is valid
    .option("--log-events", "log start/end run events")
    .addOption(
      new Option("-r, --runner <runner>", "embedded").choices(allRunnerNames)
    )
    .addOption(new Option("--runner-threads <number>").argParser(myParseInt))
    .option(
      "-b, --show-bindings",
      "show bindings even if the result is present"
    ) // incompatible with --quiet
    .action(async (filename, options) => {
      let output: OutputMode = "RESULT_OR_BINDINGS";
      if (options.quiet && options.showBindings) {
        program.error(
          "--quiet and --show-bindings can't be set at the same time."
        );
      } else if (options.quiet) {
        output = "NONE";
      } else if (options.showBindings) {
        output = "RESULT_AND_BINDINGS";
      }

      const src = loadSrc({ program, filename, inline: options.eval });

      const sampleCount = process.env["SAMPLE_COUNT"];

      await run({
        src,
        filename,
        output,
        profile: options.profile,
        measure: options.time,
        sampleCount,
        runner: options.runner,
        runnerThreads: options.runnerThreads,
        logEvents: options.logEvents,
      });
    });
}
