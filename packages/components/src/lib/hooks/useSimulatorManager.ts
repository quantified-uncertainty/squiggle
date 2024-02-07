import { useEffect, useMemo, useState } from "react";

import { Env, SqLinker, SqProject } from "@quri/squiggle-lang";

import { Simulation, useSimulator } from "./useSimulator.js";

type SetupSettings =
  | { type: "standalone" } // For standalone execution
  | {
      type: "project";
      project: SqProject;
      continues?: string[];
      sourceId?: string;
    } // Project for the parent execution. Continues is what other squiggle sources to continue. Default []
  | {
      type: "projectFromLinker";
      linker?: SqLinker;
      continues?: string[];
      sourceId?: string;
    };

export type SimulatorManagerArgs = {
  code: string;
  setup: SetupSettings;
  environment?: Env;
  initialAutorunMode?: boolean;
};

export type UseSimulatorManager = {
  sourceId: string;
  simulation?: Simulation;
  project: SqProject;

  autorunMode: boolean;
  setAutorunMode: (newValue: boolean) => void;

  runSimulation: () => void;
};

// defaultContinues needs to have a stable identity.
const defaultContinues: string[] = [];

function useSetup(setup: SetupSettings, environment?: Env) {
  const sourceId = useMemo(() => {
    if (setup.type === "project" && setup.sourceId) {
      return setup.sourceId;
    } else if (setup.type === "projectFromLinker" && setup.sourceId) {
      return setup.sourceId;
    } else {
      // random; https://stackoverflow.com/a/12502559
      return Math.random().toString(36).slice(2);
    }
  }, [setup]);

  const continues =
    setup.type === "standalone"
      ? defaultContinues
      : setup.continues ?? defaultContinues;

  const project = useMemo(() => {
    switch (setup.type) {
      case "standalone":
        return SqProject.create({ environment });
      case "projectFromLinker":
        return SqProject.create({ environment, linker: setup.linker });
      case "project":
        return setup.project;
      default:
        throw new Error("Invalid setup type");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // The project should not change.

  return { sourceId, project, continues };
}

export function useSimulatorManager(
  args: SimulatorManagerArgs
): UseSimulatorManager {
  const [autorunMode, setAutorunMode] = useState(
    args.initialAutorunMode ?? true
  );

  const { sourceId, project, continues } = useSetup(
    args.setup,
    args.environment
  );

  const [simulation, { runSimulation }] = useSimulator({
    sourceId,
    code: args.code,
    project,
    continues,
    autorunMode,
  });

  // runSimulation changes every time the code changes. That then triggers this, which would call runSimulation to actually run that updated function.
  useEffect(() => {
    if (autorunMode) {
      runSimulation();
    }
  }, [runSimulation]);

  //We only want this to run when the environment changes.
  useEffect(() => {
    if (args.environment) {
      project.setEnvironment(args.environment);
    }
    if (autorunMode) {
      runSimulation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.environment]);

  useEffect(() => {
    // This removes the source from the project when the component unmounts.
    return () => {
      project.removeSource(sourceId);
    };
  }, [project, sourceId]);

  return {
    sourceId,
    simulation,
    project,

    autorunMode,
    setAutorunMode,

    runSimulation: runSimulation,
  };
}
