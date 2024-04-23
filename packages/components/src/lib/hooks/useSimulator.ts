import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import {
  defaultRunnerName,
  Env,
  runnerByName,
  RunnerName,
  SqLinker,
  SqOutputResult,
  SqProject,
} from "@quri/squiggle-lang";

export type Simulation = {
  output: SqOutputResult;
  code: string;
  executionId: number;
  executionTime: number;
  isStale?: boolean;
  environment: Env;
};

export function isSimulating(simulation: Simulation): boolean {
  return simulation.isStale ?? false;
}

type SetupSettings =
  | { type: "standalone" } // For standalone execution
  | {
      type: "project";
      project: SqProject;
      continues?: string[];
    } // Project for the parent execution. Continues is what other squiggle sources to continue. Default []
  | {
      type: "projectFromLinker";
      linker?: SqLinker;
      continues?: string[];
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

// defaultContinues needs to have a stable identity.
const defaultContinues: string[] = [];

function useSetup({
  setup,
  sourceId,
  environment,
  runnerName,
}: {
  setup: SetupSettings;
  sourceId?: string;
  environment?: Env;
  runnerName?: RunnerName;
}) {
  const _sourceId = useMemo(() => {
    // random; https://stackoverflow.com/a/12502559
    return sourceId || Math.random().toString(36).slice(2);
  }, [sourceId]);

  const continues =
    setup.type === "standalone"
      ? defaultContinues
      : setup.continues ?? defaultContinues;

  // Intentionally using `useState` instead of `useMemo` - updates to project configuration happen as effects.
  const [project] = useState(() => {
    switch (setup.type) {
      case "standalone":
        return SqProject.create({
          environment,
          runner: runnerName ? runnerByName(runnerName) : undefined,
        });
      case "projectFromLinker":
        return SqProject.create({
          environment,
          linker: setup.linker,
          runner: runnerName ? runnerByName(runnerName) : undefined,
        });
      case "project":
        return setup.project;
      default:
        throw new Error("Invalid setup type");
    }
  });

  return { sourceId: _sourceId, project, continues };
}

type State = {
  autorunMode: boolean;
  needToRun: boolean;
  simulation: Simulation | undefined;
};
type Action =
  | {
      type: "setAutorunMode";
      value: boolean;
    }
  | {
      type: "planToRun";
    }
  | {
      type: "startedRun";
    }
  | {
      type: "setSimulation";
      value: Omit<Simulation, "executionId">;
    };

export function useSimulator(args: SimulatorArgs): UseSimulatorResult {
  const { sourceId, project, continues } = useSetup({
    setup: args.setup,
    sourceId: args.sourceId,
    environment: args.environment,
    runnerName: args.runnerName,
  });

  const [state, dispatch] = useReducer(reducer, {
    autorunMode: args.initialAutorunMode ?? true,
    needToRun: args.initialAutorunMode !== false,
    simulation: undefined,
  });

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case "setAutorunMode":
        return {
          ...state,
          autorunMode: action.value,
        };
      case "planToRun": {
        return {
          ...state,
          needToRun: true,
        };
      }
      case "startedRun":
        return {
          ...state,
          needToRun: false,
          simulation: state.simulation
            ? { ...state.simulation, isStale: true }
            : undefined,
        };
      case "setSimulation": {
        const previousExecutionId = state.simulation?.executionId || 0;
        return {
          ...state,
          simulation: {
            executionId: previousExecutionId + 1,
            isStale: false,
            code: args.code,
            output: action.value.output,
            executionTime: action.value.executionTime,
            environment: action.value.environment,
          },
        };
      }
      default:
        return state;
    }
  }

  // callbacks with stable identity
  const setAutorunMode = useCallback(
    (value: boolean) => dispatch({ type: "setAutorunMode", value }),
    []
  );

  const runSimulation = useCallback(
    async () => dispatch({ type: "planToRun" }),
    []
  );

  useEffect(() => {
    // We don't want to run the simulation if it's already running.
    // FIXME - queue
    if (!state.needToRun) {
      return;
    }

    dispatch({ type: "startedRun" });

    (async () => {
      const startTime = Date.now();
      project.setSource(sourceId, args.code);
      project.setContinues(sourceId, continues);

      const environment = project.getEnvironment(); // Get it here, just in case it changes during the run
      await project.run(sourceId);

      const output = project.getOutput(sourceId);
      const executionTime = Date.now() - startTime;

      dispatch({
        type: "setSimulation",
        value: {
          code: args.code,
          output,
          executionTime,
          environment,
        },
      });
    })();
  }, [args.code, continues, project, sourceId, state.needToRun]);

  // Re-run on environment and runner changes.
  useEffect(() => {
    if (args.environment) {
      project.setEnvironment(args.environment);
    }
    if (state.autorunMode) {
      runSimulation();
    }
  }, [project, args.environment, state.autorunMode]);

  useEffect(() => {
    project.setRunner(runnerByName(args.runnerName ?? defaultRunnerName));
    if (state.autorunMode) {
      runSimulation();
    }
  }, [project, args.runnerName, state.autorunMode]);

  // Run on code changes.
  useEffect(() => {
    if (state.autorunMode) {
      runSimulation();
    }
  }, [state.autorunMode, args.code]);

  useEffect(() => {
    // This removes the source from the project when the component unmounts.
    return () => project.removeSource(sourceId);
  }, [project, sourceId]);

  return {
    sourceId,
    project,
    simulation: state.simulation,
    autorunMode: state.autorunMode,
    setAutorunMode,
    runSimulation,
  };
}
