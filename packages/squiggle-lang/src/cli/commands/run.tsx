import { Command, Option } from "@commander-js/extra-typings";
import { promises as fs } from "fs";
import { Box, render, Text } from "ink";
import isFinite from "lodash/isFinite.js";
import path from "path";
import { FC } from "react";

import { defaultEnv, Env } from "../../dists/env.js";
import { SqLinker } from "../../public/SqLinker.js";
import { SqProject } from "../../public/SqProject/index.js";
import {
  ModuleData,
  ProjectState,
} from "../../public/SqProject/ProjectState.js";
import { SqModule } from "../../public/SqProject/SqModule.js";
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
  logProjectActions?: boolean;
};

const EVAL_SOURCE_ID = "[eval]";

function getLinker(): SqLinker {
  return {
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
      return new SqModule({
        name: sourceId,
        code,
      });
    },
  };
}

const ModuleInfo: FC<{
  state: ProjectState;
  module: SqModule;
  environment: Env;
}> = ({ state, module, environment }) => {
  const output = state.getOutput(module, environment);

  return (
    <Box gap={2}>
      <Text>{module.name}</Text>
      <Text>
        {output
          ? "✅"
          : module.getImportModules({ state }).type === "loading"
            ? "⌛ Loading imports"
            : module.getImportOutputs({ state, environment }).type === "loading"
              ? "🔄 Waiting for import outputs"
              : "▶️ Running"}
      </Text>
    </Box>
  );
};

const ModuleDataInfo: FC<{
  state: ProjectState;
  hash: string;
  moduleData: ModuleData;
  environment: Env;
}> = ({ state, hash, moduleData, environment }) => {
  return (
    <Box gap={2}>
      <Text>
        {moduleData.type === "loaded"
          ? "✅"
          : moduleData.type === "loading"
            ? "⌛"
            : "❌"}
      </Text>
      {moduleData.type === "loaded" ? (
        <ModuleInfo
          module={moduleData.value}
          state={state}
          environment={environment}
        />
      ) : (
        <Text>{hash}</Text>
      )}
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
      {[...state.modules.entries()].map(([hash, moduleData]) => (
        <ModuleDataInfo
          key={hash}
          hash={hash}
          state={state}
          moduleData={moduleData}
          environment={environment}
        />
      ))}
    </Box>
  );
};

async function _run(
  args: Pick<
    RunArgs,
    | "src"
    | "filename"
    | "runner"
    | "runnerThreads"
    | "showProjectState"
    | "logProjectActions"
  > & {
    environment: Env;
  }
) {
  const linker = getLinker();
  const runner = args.runner
    ? runnerByName(args.runner, args.runnerThreads ?? 1)
    : undefined;

  const project = new SqProject({
    linker,
    runner,
    environment: args.environment,
  });

  const rootSource = new SqModule({
    name: args.filename ?? EVAL_SOURCE_ID,
    code: args.src,
  });

  const showState = () => {
    render(<StateGraph state={project.state} environment={args.environment} />);
  };

  if (args.showProjectState) {
    project.addEventListener("action", showState);
  }

  if (args.logProjectActions) {
    project.addEventListener("action", (action) => {
      console.log(action.data);
    });
  }

  project.setHead("root", { module: rootSource });
  return await project.waitForOutput("root");
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

  const output = await _run({
    src: args.src,
    filename: args.filename,
    environment,
    runner: args.runner,
    runnerThreads: args.runnerThreads,
    showProjectState: args.showProjectState,
    logProjectActions: args.logProjectActions,
  });

  const printer = new CliPrinter();
  if (!output.result.ok) {
    printer.printSection(
      red("Error:"),
      output.result.value.toStringWithDetails()
    );
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
    printer.printSection(`${bold("Time:")} ${output.executionTime}s`);
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
    .option("--show-project-state")
    .option("--log-project-actions")
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
        logProjectActions: options.logProjectActions,
      });
    });
}
