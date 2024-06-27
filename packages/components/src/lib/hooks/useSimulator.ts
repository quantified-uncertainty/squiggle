import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import {
  Env,
  runnerByName,
  RunnerName,
  SqLinker,
  SqModuleOutput,
  SqProject,
} from "@quri/squiggle-lang";

import { UnresolvedModule } from "../../../../squiggle-lang/src/public/SqProject/UnresolvedModule.js";

export type Simulation = SqModuleOutput;

export function isSimulating(simulation: Simulation): boolean {
  return simulation.isStale ?? false;
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

  // Intentionally using `useState` instead of `useMemo` - updates to project configuration happen as effects.
  const [project] = useState(() => {
    const getRunner = () =>
      runnerName
        ? runnerByName(runnerName, runnerName === "web-worker" ? 2 : 1)
        : undefined;

    switch (setup.type) {
      case "standalone":
        return new SqProject({
          environment,
          runner: getRunner(),
        });
      case "projectFromLinker":
        return new SqProject({
          environment,
          linker: setup.linker,
          runner: getRunner(),
        });
      case "project":
        return setup.project;
      default:
        throw new Error("Invalid setup type");
    }
  });

  return { sourceId: _sourceId, project };
}

type RunTask = {
  code: string;
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
  const { sourceId, project } = useSetup({
    setup: args.setup,
    sourceId: args.sourceId,
    environment: args.environment,
    runnerName: args.runnerName,
  });

  const rootModule = useMemo(
    () =>
      new UnresolvedModule({
        name: sourceId,
        code: args.code,
        linker: project.getLinker(),
      }),
    []
  );

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
    if (!args.runnerName) {
      // Undefined runnerName shouldn't reset the project.
      // (Consider the case where `setup.project` is set with a pre-configured runner)
      return;
    }
    project.setRunner(
      runnerByName(args.runnerName, args.runnerName === "web-worker" ? 2 : 1)
    );
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
    simulation: project.getOutput(),
    autorunMode: state.autorunMode,
    setAutorunMode,
    runSimulation,
  };
}
