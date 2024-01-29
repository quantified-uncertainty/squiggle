import { useEffect, useMemo, useState } from "react";

import { Env, SqLinker, SqProject } from "@quri/squiggle-lang";

import {
  SquiggleProjectRun,
  useSquiggleProjectRun,
} from "./useSquiggleProjectRun.js";

type SetupSettings =
  | { type: "standalone" } // For standalone execution
  | { type: "project"; project: SqProject; continues?: string[] } // Project for the parent execution. Continues is what other squiggle sources to continue. Default []
  | { type: "projectFromLinker"; linker?: SqLinker; continues?: string[] };

export type SquiggleRunnerArgs = {
  code: string;
  sourceId?: string;
  setup: SetupSettings;
  environment?: Env;
  initialAutorunMode?: boolean;
};

export type SquiggleRunnerOutput = {
  sourceId: string;
  squiggleProjectRun?: SquiggleProjectRun;
  project: SqProject;

  autorunMode: boolean;
  setAutorunMode: (newValue: boolean) => void;

  runSquiggleProject: () => void;
};

// defaultContinues needs to have a stable identity.
const defaultContinues: string[] = [];

function useSetup(
  sourceId: string | undefined,
  setup: SetupSettings,
  environment?: Env
) {
  const _sourceId = useMemo(() => {
    // random; https://stackoverflow.com/a/12502559
    return sourceId ?? Math.random().toString(36).slice(2);
  }, [sourceId]);

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

  return { sourceId: _sourceId, project, continues };
}

export function useSquiggleRunner(
  args: SquiggleRunnerArgs
): SquiggleRunnerOutput {
  const [autorunMode, setAutorunMode] = useState(
    args.initialAutorunMode ?? true
  );

  const { sourceId, project, continues } = useSetup(
    args.sourceId,
    args.setup,
    args.environment
  );

  const [squiggleProjectRun, { runSquiggleProject }] = useSquiggleProjectRun({
    sourceId,
    code: args.code,
    project,
    continues,
    autorunMode,
  });

  // runSquiggleProject changes every time the code changes. That then triggers this, which would call runSquiggleProject to actually run that updated function.
  useEffect(() => {
    if (autorunMode) {
      runSquiggleProject();
    }
  }, [runSquiggleProject]);

  //We only want this to run when the environment changes.
  useEffect(() => {
    if (args.environment) {
      project.setEnvironment(args.environment);
    }
    if (autorunMode) {
      runSquiggleProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.environment]);

  useEffect(() => {
    project.removeSource(sourceId); // This is old code brought in from ``useSquiggleRun``, now ``useSquiggleProjectRun``. I'm not sure if this is necessary.
  }, [project, sourceId]);

  return {
    sourceId,
    squiggleProjectRun,
    project,

    autorunMode,
    setAutorunMode: setAutorunMode,

    runSquiggleProject: runSquiggleProject,
  };
}
