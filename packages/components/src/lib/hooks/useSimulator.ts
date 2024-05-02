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

type RunTask = {
  code: string;
  continues: string[];
  environment: Env;
  executionId: number;
  inProgress: boolean;
};

type State = {
  autorunMode: boolean;
  executionId: number;
  runQueue: RunTask[];
  simulation: Simulation | undefined;
};

type Action =
  | {
      type: "setAutorunMode";
      value: boolean;
    }
  | {
      type: "run";
    }
  | {
      type: "startTask";
      value: number; // execution id
    }
  | {
      type: "setSimulation";
      value: Simulation;
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
    executionId: 0,
    simulation: undefined,
    runQueue: [],
  });

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case "setAutorunMode":
        return {
          ...state,
          autorunMode: action.value,
        };
      case "run": {
        const executionId = state.executionId + 1;
        return {
          ...state,
          executionId,
          runQueue: [
            // No point in keeping more than two tasks in a queue, for now (see
            // below, we run tasks sequentially because SqProject is mutable and
            // we'd run into race conditions otherwise).
            ...state.runQueue.slice(0, 1),
            {
              // Note how this depends on args. This is a "cheat mode for
              // hooks", explained in
              // https://overreacted.io/a-complete-guide-to-useeffect/, under
              // "Why useReducer Is the Cheat Mode of Hooks" section.
              //
              // Thanks to this, we can avoid dependencies in `runSimulation` callback.
              code: args.code,
              continues,
              environment: project.getEnvironment(),
              inProgress: false,
              executionId,
            },
          ],
        };
      }
      case "startTask":
        return {
          ...state,
          simulation: state.simulation
            ? { ...state.simulation, isStale: true }
            : undefined,
          runQueue: state.runQueue.map((task) =>
            action.value === task.executionId
              ? { ...task, inProgress: true }
              : task
          ),
        };
      case "setSimulation": {
        return {
          ...state,
          runQueue: state.runQueue.filter(
            (task) => task.executionId !== action.value.executionId
          ),
          simulation: action.value,
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

  const runSimulation = useCallback(() => dispatch({ type: "run" }), []);

  // Whenever the run queue changes, we attempt to process it.
  useEffect(() => {
    // nothing to run
    if (!state.runQueue.length) {
      return;
    }

    // take the first task from the start of the queue
    const task = state.runQueue[0];
    if (task.inProgress) {
      // SqProject can't run the same source with different code in parallel yet, so we process one task at a time.
      return;
    }
    dispatch({ type: "startTask", value: task.executionId });

    (async () => {
      const startTime = Date.now();
      project.setSource(sourceId, task.code);
      project.setContinues(sourceId, task.continues);

      await project.run(sourceId);

      const output = project.getOutput(sourceId);
      const executionTime = Date.now() - startTime;

      dispatch({
        type: "setSimulation",
        value: {
          executionId: task.executionId,
          code: task.code,
          output,
          executionTime,
          environment: task.environment,
        },
      });
    })();
  }, [project, sourceId, state.runQueue]);

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
    return () => {
      // We have to delay the cleanup, because `project.run` is async and can
      // start with a bit of the delay; we don't want to remove source before
      // the run starts.
      // (It's possible there are still race conditions here.)
      setTimeout(() => {
        project.removeSource(sourceId);
      }, 10);
    };
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
