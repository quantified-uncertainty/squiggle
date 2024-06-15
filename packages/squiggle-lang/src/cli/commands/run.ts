import { Command, Option } from "@commander-js/extra-typings";
import { promises as fs } from "fs";
import isFinite from "lodash/isFinite.js";
import path from "path";

import { defaultEnv, Env } from "../../dists/env.js";
import { SqLinker } from "../../public/SqLinker.js";
import { SqProject } from "../../public/SqProject/index.js";
import { allRunnerNames, runnerByName } from "../../runners/index.js";
import { bold, red } from "../colors.js";
import { loadSrc, measure } from "../utils.js";

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
};

const EVAL_SOURCE_ID = "[eval]";

const linker: SqLinker = {
  resolve: (name, fromId) => {
    if (!name.startsWith("./") && !name.startsWith("../")) {
      throw new Error("Only relative paths in imports are allowed");
    }
    const dir =
      fromId === EVAL_SOURCE_ID ? process.cwd() : path.dirname(fromId);
    return path.resolve(dir, name);
  },
  loadSource: async (importId: string) => {
    return await fs.readFile(importId, "utf-8");
  },
};

async function _run(
  args: Pick<RunArgs, "src" | "filename" | "runner"> & {
    environment?: Env;
  }
) {
  const project = SqProject.create({
    linker,
    runner: args.runner ? runnerByName(args.runner) : undefined,
    environment: args.environment,
  });
  const filename = args.filename ? path.resolve(args.filename) : EVAL_SOURCE_ID;

  project.setSource(filename, args.src);

  const time = await measure(async () => await project.run(filename));
  const output = project.getOutput(filename);

  return { output, time, project };
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

  const { output, time, project } = await _run({
    src: args.src,
    filename: args.filename,
    environment,
    runner: args.runner,
  });

  // Prints a section consisting of multiple lines; prints an extra "\n" if a section was printed before.
  let isFirstSection = true;
  const printLines = (...lines: string[]) => {
    if (!isFirstSection) {
      console.log();
    }
    isFirstSection = false;
    lines.forEach((line) => console.log(line));
  };

  if (!output.ok) {
    printLines(red("Error:"), output.value.toStringWithDetails(project));
  } else {
    switch (args.output) {
      case "RESULT_OR_BINDINGS":
        if (output.value.result.tag === "Void") {
          printLines(output.value.bindings.toString());
        } else {
          printLines(output.value.result.toString());
        }
        break;
      case "RESULT_AND_BINDINGS":
        printLines(bold("Result:"), output.value.result.toString());
        printLines(bold("Bindings:"), output.value.bindings.toString());
        break;
      case "NONE":
      // do nothing
    }
  }

  if (args.measure) {
    printLines(`${bold("Time:")} ${time}s`);
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
    .addOption(
      new Option("-r, --runner <runner>", "embedded").choices(allRunnerNames)
    )
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
      });
    });
}
