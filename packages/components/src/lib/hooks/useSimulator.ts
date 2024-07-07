import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

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

type State = {
  autorunMode: boolean;
  executionId: number;
  output: SqModuleOutput | undefined;
};

type Action =
  | {
      type: "setAutorunMode";
      value: boolean;
    }
  | {
      type: "setOutput";
      value: SqModuleOutput;
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

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case "setAutorunMode":
        return {
          ...state,
          autorunMode: action.value,
        };
      case "setOutput": {
        return {
          ...state,
          output: action.value,
          executionId: state.executionId + 1,
        };
      }
      default:
        throw action satisfies never;
    }
  }

  const [state, dispatch] = useReducer(reducer, {
    autorunMode: args.initialAutorunMode ?? true,
    executionId: 0,
    output: undefined,
  });

  // TODO - generate random head name? `project` could be passed from outside and have a head already.
  const mainHead = "main";

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

  // Run on code and environment changes if autorun is on.
  useEffect(() => {
    if (state.autorunMode) {
      runSimulation();
    }
  }, [state.autorunMode, runSimulation]);

  // callbacks with stable identity
  const setAutorunMode = useCallback(
    (value: boolean) => dispatch({ type: "setAutorunMode", value }),
    []
  );

  // Whenever the main head output arrives, we capture it.
  useEffect(() => {
    const listener: Parameters<typeof project.addEventListener<"output">>[1] = (
      event
    ) => {
      if (!project.hasHead(mainHead)) {
        return;
      }
      const rootModule = project.getHead(mainHead);
      if (event.data.output.module.hash() === rootModule.hash()) {
        dispatch({
          type: "setOutput",
          value: event.data.output,
        });
      }
    };
    project.addEventListener("output", listener);

    return () => project.removeEventListener("output", listener);
  }, [project]);

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
  }, [project, args.runnerName, state.autorunMode]);

  return {
    sourceId,
    project,
    simulation: state.output
      ? {
          executionId: state.executionId,
          output: state.output,
          isStale:
            state.output.module.hash() !== project.getHead(mainHead).hash(),
        }
      : undefined,
    autorunMode: state.autorunMode,
    setAutorunMode,
    runSimulation,
  };
}
