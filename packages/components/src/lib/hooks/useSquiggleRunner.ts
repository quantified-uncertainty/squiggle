import { useEffect, useMemo, useState } from "react";

import { Env, SqProject } from "@quri/squiggle-lang";

import { defaultViewerTab, ViewerTab } from "../utility.js";
import {
  SquiggleOutput,
  useSquiggleProjectRun,
} from "./useSquiggleProjectRun.js";

// Props needed for a standalone execution.
export type StandaloneExecutionProps = {
  project?: undefined;
  environment?: Env;
  continues?: undefined;
};

// Props needed when executing inside a project.
export type ProjectExecutionProps = {
  /** The project that this execution is part of */
  project: SqProject;
  environment?: undefined;
  /** What other squiggle sources from the project to continue. Default [] */
  continues?: string[];
};

type RunSetup =
  | { type: "standalone"; environment?: Env } // For standalone execution
  | { type: "project"; project: SqProject; continues?: string[] }; // Project for the parent execution. Continues is what other squiggle sources to continue. Default []

export type SquiggleRunnerArgs = {
  code: string;
  sourceId?: string;
  setup: RunSetup;
};

export type SquiggleRunnerOutput = {
  sourceId: string;
  squiggleOutput?: SquiggleOutput;
  project: SqProject;

  viewerTab: ViewerTab;
  setViewerTab: (newValue: ViewerTab) => void;

  autorunMode: boolean;
  setAutorunMode: (newValue: boolean) => void;

  setProjectEnvironment: (newEnv: Env) => void;
  rerunSquiggleCode: () => void;

  seed: string;
  setSeed: (newValue: string) => void;
};

export function getIsRunning(squiggleOutput: SquiggleOutput): boolean {
  return squiggleOutput.isStale ?? false;
}

const defaultContinues: string[] = [];

function useRunnerSetup(sourceId: string | undefined, setup: RunSetup) {
  const _sourceId = useMemo(() => {
    // random; https://stackoverflow.com/a/12502559
    return sourceId ?? Math.random().toString(36).slice(2);
  }, [sourceId]);

  const continues =
    setup.type === "standalone"
      ? defaultContinues
      : setup.continues ?? defaultContinues;

  const project = useMemo(() => {
    if (setup.type === "project") {
      return setup.project;
    } else {
      const _project = SqProject.create();
      if (setup.environment) {
        _project.setEnvironment(setup.environment);
      }
      return _project;
    }
  }, [setup]);

  return { sourceId: _sourceId, project, continues };
}

export function useSquiggleRunner(
  args: SquiggleRunnerArgs
): SquiggleRunnerOutput {
  const [autorunMode, setAutorunMode] = useState(true);
  const [seed, setSeed] = useState<string>("starting-seed");

  const [viewerTab, setViewerTab] = useState<ViewerTab | undefined>(undefined);

  const { sourceId, project, continues } = useRunnerSetup(
    args.sourceId,
    args.setup
  );

  const [squiggleOutput, { rerunSquiggleCode }] = useSquiggleProjectRun({
    sourceId,
    code: args.code,
    project,
    continues,
    autorunMode,
  });

  // Set viewerTab the first time that SqOutputResult is not undefined.
  useEffect(() => {
    if (!viewerTab && squiggleOutput?.output) {
      setViewerTab(defaultViewerTab(squiggleOutput.output));
    }
  }, [squiggleOutput?.output, viewerTab]);

  // Allow callers to update the environment, outside of the normal SquiggleRunnerArgs setup.
  const updateEnvironment = useMemo(
    () => (newEnv: Env) => {
      project.setEnvironment(newEnv);
      if (autorunMode) {
        rerunSquiggleCode();
      }
    },
    [autorunMode, project, rerunSquiggleCode]
  );

  return {
    sourceId,
    squiggleOutput,
    project,

    viewerTab: viewerTab ?? defaultViewerTab(undefined),
    setViewerTab,

    autorunMode,
    setAutorunMode: setAutorunMode,

    setProjectEnvironment: updateEnvironment,
    rerunSquiggleCode: rerunSquiggleCode,

    seed,
    setSeed,
  };
}
