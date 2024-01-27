import { useEffect, useMemo, useRef, useState } from "react";

import { Env, SqProject } from "@quri/squiggle-lang";

import { defaultViewerTab, ViewerTab } from "../utility.js";
import { SquiggleOutput, useSquiggle } from "./useSquiggle.js";

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

export type SquiggleRunnerArgs = {
  code: string;
  sourceId?: string;
} & (StandaloneExecutionProps | ProjectExecutionProps);

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

export function useSquiggleRunner(
  args: SquiggleRunnerArgs
): SquiggleRunnerOutput {
  const [autorunMode, setAutorunMode] = useState(true);
  const [seed, setSeed] = useState<string>("starting-seed");
  const isViewerTabSet = useRef(false);

  const [viewerTab, setViewerTab] = useState<ViewerTab>(() => {
    return defaultViewerTab(undefined);
  });

  const sourceId = useMemo(() => {
    return args.sourceId ?? Math.random().toString(36).slice(2);
  }, [args.sourceId]);

  const projectArg = "project" in args ? args.project : undefined;
  const environment = "environment" in args ? args.environment : undefined;

  const continues =
    "continues" in args ? args.continues ?? defaultContinues : defaultContinues;

  const project = useMemo(() => {
    if (projectArg) {
      return projectArg;
    } else {
      const p = SqProject.create();
      if (environment) {
        p.setEnvironment(environment);
      }
      return p;
    }
  }, [projectArg, environment]);

  const [squiggleOutput, { rerunSquiggleCode }] = useSquiggle({
    sourceId,
    code: args.code,
    project,
    continues,
    autorunMode,
  });

  useEffect(() => {
    if (!isViewerTabSet.current && squiggleOutput?.output) {
      setViewerTab(defaultViewerTab(squiggleOutput.output));
      isViewerTabSet.current = true; // Mark that mode is set
    }
  }, [squiggleOutput?.output]);

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

    viewerTab,
    setViewerTab,

    autorunMode,
    setAutorunMode: setAutorunMode,

    setProjectEnvironment: updateEnvironment,
    rerunSquiggleCode: rerunSquiggleCode,

    seed,
    setSeed,
  };
}
