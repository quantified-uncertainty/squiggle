import { type Command, Option } from "@commander-js/extra-typings";
import fs from "fs";
import { render } from "ink";

import { type JsonValue } from "@quri/serializer";

import { defaultEnv, Env } from "../../dists/env.js";
import { SqProject } from "../../public/SqProject/index.js";
import { SqModule } from "../../public/SqProject/SqModule.js";
import { SqModuleOutput } from "../../public/SqProject/SqModuleOutput.js";
import { SqDict } from "../../public/SqValue/SqDict.js";
import { sqValueToJson } from "../../public/SqValue/toJson.js";
import { allRunnerNames, runnerByName } from "../../runners/index.js";
import { CliPrinter } from "../CliPrinter.js";
import { bold } from "../colors.js";
import { ErrorJson, errorToJson, printErrors } from "../errorReport.js";
import { EVAL_SOURCE_ID, makeFileLinker } from "../linker.js";
import { StateGraph } from "../StateGraph.js";
import { loadSrc, myParseInt } from "../utils.js";

type OutputMode =
  | "NONE"
  | "RESULT_OR_BINDINGS"
  | "RESULT_AND_BINDINGS"
  | "JSON";

type RunArgs = {
  src: string;
  filename?: string;
  output: OutputMode;
  measure?: boolean;
  sampleCount?: number;
  seed?: string;
  samples?: number; // number of raw samples to include per distribution in JSON output
  profile?: boolean;
  runner?: Parameters<typeof runnerByName>[0];
  runnerThreads?: number;
  showProjectState?: boolean;
  logProjectActions?: boolean;
};

export type RunJsonOutput = {
  ok: boolean;
  result: JsonValue;
  bindings: { [name: string]: JsonValue };
  exports?: { [name: string]: JsonValue };
  errors: ErrorJson[];
  timeMs: number;
};

export function makeEnvironment({
  sampleCount,
  seed,
  profile,
}: {
  sampleCount?: number;
  seed?: string;
  profile?: boolean;
}): Env {
  return {
    sampleCount: sampleCount ?? defaultEnv.sampleCount,
    xyPointLength: sampleCount ?? defaultEnv.xyPointLength,
    seed: seed || "default-seed",
    profile: profile ?? false,
  };
}

async function evaluate(args: RunArgs & { environment: Env }) {
  const linker = makeFileLinker();
  const runner = args.runner
    ? runnerByName(args.runner, args.runnerThreads ?? 1)
    : undefined;

  const project = new SqProject({
    linker,
    runner,
    environment: args.environment,
  });

  const rootName = args.filename ?? EVAL_SOURCE_ID;
  linker.sources.set(rootName, args.src);
  const rootSource = new SqModule({ name: rootName, code: args.src });

  if (args.showProjectState) {
    project.addEventListener("action", () => {
      render(
        <StateGraph state={project.state} environment={args.environment} />
      );
    });
  }

  if (args.logProjectActions) {
    project.addEventListener("action", (action) => {
      console.log(action.data);
    });
  }

  project.setHead("root", { module: rootSource });
  const output = await project.waitForOutput("root");
  return { output, sources: linker.sources };
}

function dictToJson(dict: SqDict, samples: number | undefined) {
  return Object.fromEntries(
    dict.entries().map(([k, v]) => [k, sqValueToJson(v, { samples })])
  );
}

export function outputToJson(
  output: SqModuleOutput,
  sources: ReadonlyMap<string, string>,
  samples?: number
): RunJsonOutput {
  const timeMs = output.executionTime;
  if (!output.result.ok) {
    return {
      ok: false,
      result: null,
      bindings: {},
      errors: output.result.value.errors.map((e) => errorToJson(e, sources)),
      timeMs,
    };
  }
  const { result, bindings, exports } = output.result.value;
  return {
    ok: true,
    result: sqValueToJson(result, { samples }),
    bindings: dictToJson(bindings, samples),
    ...(exports.isEmpty() ? {} : { exports: dictToJson(exports, samples) }),
    errors: [],
    timeMs,
  };
}

// Runs the code once and prints the output. Returns the files that were loaded, for `--watch`.
async function run(args: RunArgs): Promise<string[]> {
  const environment = makeEnvironment(args);
  const { output, sources } = await evaluate({ ...args, environment });

  if (!output.result.ok) {
    process.exitCode = 1;
  }

  if (args.output === "JSON") {
    console.log(
      JSON.stringify(outputToJson(output, sources, args.samples), null, 2)
    );
    return [...sources.keys()];
  }

  const printer = new CliPrinter();
  if (!output.result.ok) {
    printErrors(printer, output.result.value.errors, sources);
  } else {
    const outputResult = output.result.value;
    switch (args.output) {
      case "RESULT_OR_BINDINGS":
        if (outputResult.result.tag === "Void") {
          printer.printSection(outputResult.bindings.toString());
        } else {
          printer.printSection(outputResult.result.toString());
        }
        break;
      case "RESULT_AND_BINDINGS":
        printer.printSection(bold("Result:"), outputResult.result.toString());
        printer.printSection(
          bold("Bindings:"),
          outputResult.bindings.toString()
        );
        break;
      case "NONE":
      // do nothing
    }
  }

  if (args.measure) {
    printer.printSection(`${bold("Time:")} ${output.executionTime / 1000}s`);
  }
  return [...sources.keys()];
}

// Re-runs the code whenever the root file or any of its (transitive) imports change.
async function watch(args: RunArgs, filename: string) {
  let watchers: fs.FSWatcher[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;

  const rerun = async () => {
    if (running) return;
    running = true;
    watchers.forEach((w) => w.close());
    watchers = [];

    let files = [filename];
    try {
      const src = fs.readFileSync(filename, "utf-8");
      if (args.output !== "JSON") console.clear();
      process.exitCode = undefined;
      files = await run({ ...args, src });
    } catch (e) {
      console.error(e instanceof Error ? e.message : String(e));
    }
    if (args.output !== "JSON") {
      console.error(`\nWatching ${files.length} file(s) for changes...`);
    }

    for (const file of new Set([filename, ...files])) {
      if (file === EVAL_SOURCE_ID || !fs.existsSync(file)) continue;
      watchers.push(
        fs.watch(file, () => {
          clearTimeout(timer);
          timer = setTimeout(() => void rerun(), 100);
        })
      );
    }
    running = false;
  };

  await rerun();
}

export function addRunCommand(program: Command) {
  program
    .command("run")
    .description("Evaluate Squiggle code and print the result")
    .arguments("[filename]")
    .option(
      "-e, --eval <code>",
      "run a given squiggle code string instead of a file"
    )
    .option(
      "--json",
      "print a single JSON object {ok, result, bindings, exports, errors, timeMs} to stdout"
    )
    .addOption(
      new Option(
        "--samples <n>",
        "with --json, include up to n raw samples per sample set distribution"
      ).argParser(myParseInt)
    )
    .option("--seed <seed>", "random seed (default: 'default-seed')")
    .addOption(
      new Option(
        "-n, --sample-count <n>",
        "number of samples per distribution (default: 1000)"
      )
        .env("SAMPLE_COUNT")
        .argParser(myParseInt)
    )
    .option(
      "-w, --watch",
      "re-run when the file or its imports change (requires a filename)"
    )
    .option("-t --time", "output the time it took to evaluate the code")
    .option("-p --profile", "performance profiler")
    .option("-q, --quiet", "don't output the results and bindings") // useful for measuring the performance or checking that the code is valid
    .option("--show-project-state")
    .option("--log-project-actions")
    .addOption(
      new Option(
        "-r, --runner <runner>",
        "runner to evaluate code with"
      ).choices(allRunnerNames)
    )
    .addOption(new Option("--runner-threads <number>").argParser(myParseInt))
    .option(
      "-b, --show-bindings",
      "show bindings even if the result is present"
    ) // incompatible with --quiet
    .addHelpText(
      "after",
      `
Examples:
  $ squiggle run model.squiggle
  $ squiggle run -e "normal(10, 2) * 3"
  $ squiggle run model.squiggle --json --seed 42 --sample-count 10000
  $ squiggle run model.squiggle --watch

Exit code is 1 if the code fails to compile or run (also with --json).`
    )
    .action(async (filename, options) => {
      let output: OutputMode = "RESULT_OR_BINDINGS";
      if (options.quiet && options.showBindings) {
        program.error(
          "--quiet and --show-bindings can't be set at the same time."
        );
      } else if (options.json) {
        output = "JSON";
      } else if (options.quiet) {
        output = "NONE";
      } else if (options.showBindings) {
        output = "RESULT_AND_BINDINGS";
      }

      if (options.watch && filename === undefined) {
        program.error("--watch requires a filename.");
      }

      const src = loadSrc({ program, filename, inline: options.eval });

      const args: RunArgs = {
        src,
        filename,
        output,
        profile: options.profile,
        measure: options.time,
        sampleCount: options.sampleCount,
        seed: options.seed,
        samples: options.samples,
        runner: options.runner,
        runnerThreads: options.runnerThreads,
        showProjectState: options.showProjectState,
        logProjectActions: options.logProjectActions,
      };

      if (options.watch && filename !== undefined) {
        await watch(args, filename);
      } else {
        await run(args);
      }
    });
}
