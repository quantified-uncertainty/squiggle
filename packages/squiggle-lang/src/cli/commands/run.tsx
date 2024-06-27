import { Command, Option } from "@commander-js/extra-typings";
import { promises as fs } from "fs";
import { Box, render, Text } from "ink";
import isFinite from "lodash/isFinite.js";
import path from "path";
import { FC } from "react";

import { defaultEnv, Env } from "../../dists/env.js";
import { SqLinker } from "../../public/SqLinker.js";
import { SqProject } from "../../public/SqProject/index.js";
import { OutputResult } from "../../public/SqProject/ModuleOutput.js";
import { ProjectState } from "../../public/SqProject/ProjectState.js";
import { UnresolvedModule } from "../../public/SqProject/UnresolvedModule.js";
import { allRunnerNames, runnerByName } from "../../runners/index.js";
import { CliPrinter } from "../CliPrinter.js";
import { bold, red } from "../colors.js";
import { loadSrc, myParseInt } from "../utils.js";

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
  showProjectState?: boolean;
};

const EVAL_SOURCE_ID = "[eval]";

function getLinker(): SqLinker {
  const linker: SqLinker = {
    resolve(name, fromId) {
      if (!name.startsWith("./") && !name.startsWith("../")) {
        throw new Error("Only relative paths in imports are allowed");
      }
      const dir =
        fromId === EVAL_SOURCE_ID ? process.cwd() : path.dirname(fromId);
      return path.relative(process.cwd(), path.resolve(dir, name));
    },
    async loadModule(sourceId, hash) {
      if (hash) {
        throw new Error("Hashes are not supported");
      }
      const code = await fs.readFile(sourceId, "utf-8");
      return new UnresolvedModule({
        name: sourceId,
        code,
        linker,
      });
    },
  };
  return linker;
}

const ModuleInfo: FC<{
  state: ProjectState;
  module: UnresolvedModule;
  environment: Env;
}> = ({ state, module, environment }) => {
  const resolved = state.getResolvedModule(module);
  const output = resolved ? state.getOutput(resolved, environment) : undefined;

  return (
    <Box gap={2}>
      <Text>{output ? "✅" : resolved ? "▶️" : "🔄"}</Text>
      <Text>{module.name}</Text>
    </Box>
  );
};

const StateGraph: FC<{ state: ProjectState; environment: Env }> = ({
  state,
  environment,
}) => {
  return (
    <Box flexDirection="column">
      <Text bold color="green">
        State
      </Text>
      {[...state.unresolvedModules.entries()].map(([hash, module]) => (
        <ModuleInfo
          key={hash}
          state={state}
          module={module}
          environment={environment}
        />
      ))}
    </Box>
  );
};

async function _run(
  args: Pick<
    RunArgs,
    "src" | "filename" | "runner" | "runnerThreads" | "showProjectState"
  > & {
    environment: Env;
  }
) {
  const linker = getLinker();
  const rootSource = new UnresolvedModule({
    name: args.filename ?? EVAL_SOURCE_ID,
    code: args.src,
    linker,
  });
  const runner = args.runner
    ? runnerByName(args.runner, args.runnerThreads ?? 1)
    : undefined;

  const project = new SqProject({
    rootSource,
    linker,
    runner,
    environment: args.environment,
  });

  const showState = () => {
    render(<StateGraph state={project.state} environment={args.environment} />);
  };

  if (args.showProjectState) {
    project.addEventListener("action", showState);
  }

  const started = new Date();
  return new Promise<{ output: OutputResult; time: number }>(
    (resolve, reject) => {
      project.addEventListener("output", (e) => {
        if (e.data.output.module.module === rootSource) {
          const output = project.getOutput();
          if (output) {
            const time = (new Date().getTime() - started.getTime()) / 1000;
            if (args.showProjectState) {
              showState();
            }
            resolve({ output: output.output, time });
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
    showProjectState: args.showProjectState,
  });

  const printer = new CliPrinter();
  if (!output.ok) {
    printer.printSection(red("Error:"), output.value.toStringWithDetails());
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
    .option("--show-project-state", "show project state")
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
        showProjectState: options.showProjectState,
      });
    });
}
