import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Env,
  runnerByName,
  RunnerName,
  SqLinker,
  SqModule,
  SqModuleOutput,
  SqProject,
} from "@quri/squiggle-lang";

import { useForceUpdate } from "./useForceUpdate.js";

export type Simulation = {
  project: SqProject; // useful in ViewerWithMenuBar
  isStale: boolean;
  executionId: number;
  output: SqModuleOutput;
};

export function isSimulating(simulation: Simulation): boolean {
  return simulation.isStale;
}

type SetupSettings =
  | { type: "standalone" } // For standalone execution
  | {
      type: "project";
      project: SqProject;
    } // Project for the parent execution. Continues is what other squiggle sources to continue. Default []
  | {
      type: "projectFromLinker";
      linker?: SqLinker;
    };

type SimulatorArgs = {
  code: string;
  setup: SetupSettings;
  sourceId?: string;
  environment?: Env;
  initialAutorunMode?: boolean;
  runnerName?: RunnerName;
};

type UseSimulatorResult = {
  sourceId: string;
  simulation?: Simulation;
  project: SqProject;

  autorunMode: boolean;
  setAutorunMode: (newValue: boolean) => void;

  runSimulation: () => void;
};

export function useSimulator(args: SimulatorArgs): UseSimulatorResult {
  const sourceId = useMemo(() => {
    // random; https://stackoverflow.com/a/12502559
    return args.sourceId || Math.random().toString(36).slice(2);
  }, [args.sourceId]);

  // Intentionally using `useState` instead of `useMemo` - updates to project configuration happen as effects.
  const [project] = useState(() => {
    const getRunner = () =>
      args.runnerName
        ? runnerByName(
            args.runnerName,
            args.runnerName === "web-worker" ? 2 : 1
          )
        : undefined;

    switch (args.setup.type) {
      case "standalone":
        return new SqProject({
          environment: args.environment,
          runner: getRunner(),
        });
      case "projectFromLinker":
        return new SqProject({
          environment: args.environment,
          linker: args.setup.linker,
          runner: getRunner(),
        });
      case "project":
        return args.setup.project;
      default:
        throw new Error("Invalid setup type");
    }
  });

  // Uncomment these lines if you need to debug SqProject actions or state changes:
  // useProjectActionLogger(project);
  // useProjectStateChangeLogger(project);

  // TODO - generate random head names? `project` could be passed from outside and have heads already.
  const mainHead = "main";
  const renderedHead = "rendered";

  const [autorunMode, setAutorunMode] = useState(
    args.initialAutorunMode ?? true
  );
  const [executionId, setExecutionId] = useState(0);

  const forceUpdate = useForceUpdate();

  const runSimulation = useCallback(() => {
    if (args.environment && args.environment !== project.state.environment) {
      project.setEnvironment(args.environment);
    }

    const rootModule = new SqModule({
      name: sourceId,
      code: args.code,
    });
    project.setHead(mainHead, { module: rootModule });
    forceUpdate(); // necessary for correct isStale
  }, [project, sourceId, forceUpdate, args.environment, args.code]);

  // Whenever the main head output arrives, we capture it.
  // Important: this listener should be set before the first runSimulation call.
  // In some cases (trivial circular imports), project will emit output event synchronously.
  useEffect(() => {
    const listener: Parameters<typeof project.addEventListener<"output">>[1] = (
      event
    ) => {
      if (!project.hasHead(mainHead)) {
        return;
      }
      const rootModule = project.getHead(mainHead);
      if (event.data.output.module.hash() === rootModule.hash()) {
        project.setHead(renderedHead, event.data.output);
        setExecutionId((prev) => prev + 1);
      }
    };
    project.addEventListener("output", listener);

    return () => project.removeEventListener("output", listener);
  }, [project]);

  // Run on code and environment changes if autorun is on.
  useEffect(() => {
    if (autorunMode) {
      runSimulation();
    }
  }, [autorunMode, runSimulation]);

  // React to runner changes.
  useEffect(() => {
    if (!args.runnerName) {
      // Undefined runnerName shouldn't reset the project.
      // (Consider the case where `setup.project` is set with a pre-configured runner)
      return;
    }
    project.setRunner(
      runnerByName(args.runnerName, args.runnerName === "web-worker" ? 2 : 1)
    );
  }, [project, args.runnerName, autorunMode]);

  const output = project.hasHead(renderedHead)
    ? project.getOutput(renderedHead)
    : undefined;

  return {
    sourceId,
    project,
    simulation: output
      ? {
          project,
          executionId,
          output,
          isStale: project.getHead(mainHead) !== project.getHead(mainHead),
        }
      : undefined,
    autorunMode,
    setAutorunMode,
    runSimulation,
  };
}
