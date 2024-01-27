import { useEffect, useMemo, useRef, useState } from "react";

import { Env, SqProject } from "@quri/squiggle-lang";

import { defaultMode, ViewerMode } from "../utility.js";
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
  squiggleOutput?: SquiggleOutput;
  mode: string;
  setMode: (newValue: string) => void;
  project: SqProject;
  sourceId: string;
  run: () => void;
  setAutorunMode: (newValue: boolean) => void;
  autorunMode: boolean;
  setEnvironment: (newEnv: Env) => void;
};

export function getIsRunning(squiggleOutput: SquiggleOutput): boolean {
  return squiggleOutput.isStale ?? false;
}

const defaultContinues: string[] = [];

export function useSquiggleRunner(args: SquiggleRunnerArgs) {
  const [autorunMode, setAutorunMode] = useState(true);

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

  const [squiggleOutput, { reRun }] = useSquiggle({
    sourceId,
    code: args.code,
    project,
    environment,
    continues,
  });

  const isModeSet = useRef(false);

  const [mode, setMode] = useState<ViewerMode>(() => {
    return defaultMode(undefined);
  });

  useEffect(() => {
    if (!isModeSet.current && squiggleOutput?.output) {
      setMode(defaultMode(squiggleOutput.output));
      isModeSet.current = true; // Mark that mode is set
    }
  }, [squiggleOutput?.output]);

  return {
    sourceId,
    squiggleOutput,
    project,
    rerunSquiggleCode: reRun,

    mode,
    setMode,
    autorunMode,
    setAutorunMode: setAutorunMode,
    setEnvironment: (newEnv: Env) => {
      project.setEnvironment(newEnv);
      if (autorunMode) {
        reRun();
      }
    },
  };
}
