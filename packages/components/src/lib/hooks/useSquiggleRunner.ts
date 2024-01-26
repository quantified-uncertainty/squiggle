import { useEffect, useRef, useState } from "react";

import { SqProject } from "@quri/squiggle-lang";

import { defaultMode, ViewerMode } from "../utility.js";
import { RunnerState, useRunnerState } from "./useRunnerState.js";
import {
  ProjectExecutionProps,
  SquiggleOutput,
  StandaloneExecutionProps,
  useSquiggle,
} from "./useSquiggle.js";

export type SquiggleRunnerArgs = {
  code: string;
} & (StandaloneExecutionProps | ProjectExecutionProps);

export type SquiggleRunnerOutput = {
  squiggleOutput?: SquiggleOutput;
  runnerState: RunnerState;
  mode: string;
  setMode: (newValue: string) => void;
  isRunning: boolean;
  project: SqProject;
  sourceId: string;
};

export function useSquiggleRunner(args: SquiggleRunnerArgs) {
  const runnerState = useRunnerState(args.code);

  const [squiggleOutput, { isRunning, sourceId, project }] = useSquiggle({
    code: runnerState.renderedCode,
    executionId: runnerState.executionId,
    ...(args.project
      ? { project: args.project, continues: args.continues }
      : { environment: args.environment }),
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
    squiggleOutput,
    runnerState,
    mode,
    sourceId,
    project,
    setMode,
    isRunning,
  };
}
