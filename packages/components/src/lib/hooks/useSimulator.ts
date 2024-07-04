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

export type Simulation = {
  isStale: boolean;
  executionId: number;
  output: SqModuleOutput;
};

export function isSimulating(simulation: Simulation): boolean {
  return simulation.isStale ?? false;
}

// Useful for debugging.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useProjectActionLogger(project: SqProject) {
  useEffect(() => {
    const listener: Parameters<typeof project.addEventListener<"action">>[1] = (
      event
    ) => {
      // eslint-disable-next-line no-console
      console.log("action", event.data);
    };
    project.addEventListener("action", listener);
    return () => project.removeEventListener("action", listener);
  }, [project]);
}

// Useful for debugging.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useProjectStateChangeLogger(project: SqProject) {
  useEffect(() => {
    const listener: Parameters<typeof project.addEventListener<"state">>[1] = (
      event
    ) => {
      // eslint-disable-next-line no-console
      console.log(event.data);
    };
    project.addEventListener("state", listener);
    return () => project.removeEventListener("state", listener);
  }, [project]);
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

type State = {
  autorunMode: boolean;
  executionId: number;
  codeToSimulate: string | undefined;
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
      type: "setSimulation";
      value: SqModuleOutput;
    };

export function useSimulator(args: SimulatorArgs): UseSimulatorResult {
  const { sourceId, project } = useSetup({
    setup: args.setup,
    sourceId: args.sourceId,
    environment: args.environment,
    runnerName: args.runnerName,
  });

  // Uncomment these lines if you need to debug SqProject actions or state changes:
  // useProjectActionLogger(project);
  // useProjectStateChangeLogger(project);

  const [state, dispatch] = useReducer(reducer, {
    autorunMode: args.initialAutorunMode ?? true,
    executionId: 0,
    codeToSimulate: args.initialAutorunMode ? args.code : undefined,
    simulation: undefined,
  });

  const rootModule = useMemo(
    () =>
      state.codeToSimulate
        ? new SqModule({
            name: sourceId,
            code: state.codeToSimulate,
          })
        : undefined,
    [sourceId, state.codeToSimulate]
  );

  // TODO - generate random head name? `project` could be passed from outside and have a head already.
  const mainHead = "main";

  // Whenever the code changes, we update the project.
  // Setting the head will automatically run it.
  useEffect(() => {
    if (!rootModule) {
      return;
    }
    project.setHead(mainHead, { module: rootModule });
  }, [project, rootModule]);

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case "setAutorunMode":
        return {
          ...state,
          autorunMode: action.value,
          codeToSimulate: action.value ? args.code : state.codeToSimulate,
        };
      case "run": {
        return {
          ...state,
          codeToSimulate: args.code,
          simulation: state.simulation
            ? {
                ...state.simulation,
                isStale: true,
              }
            : undefined,
        };
      }
      case "setSimulation": {
        return {
          ...state,
          simulation: {
            output: action.value,
            executionId: (state.simulation?.executionId ?? 0) + 1,
            isStale: false,
          },
        };
      }
      default:
        throw action satisfies never;
    }
  }

  // callbacks with stable identity
  const setAutorunMode = useCallback(
    (value: boolean) => dispatch({ type: "setAutorunMode", value }),
    []
  );

  const runSimulation = useCallback(() => dispatch({ type: "run" }), []);

  // Whenever the main head output arrives, we capture it.
  useEffect(() => {
    const listener: Parameters<typeof project.addEventListener<"output">>[1] = (
      event
    ) => {
      if (rootModule && event.data.output.module.hash() === rootModule.hash()) {
        dispatch({
          type: "setSimulation",
          value: event.data.output,
        });
      }
    };
    project.addEventListener("output", listener);

    return () => project.removeEventListener("output", listener);
  }, [project, rootModule, state.executionId]);

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

  return {
    sourceId,
    project,
    simulation: state.simulation,
    autorunMode: state.autorunMode,
    setAutorunMode,
    runSimulation,
  };
}
