import { useLayoutEffect, useReducer, useRef } from "react";

type InternalState = {
  autorunMode: boolean;
  renderedCode: string;
  // "prepared" is for rendering a spinner; "run" for executing squiggle code; then it gets back to "none" on the next render
  runningState: "none" | "prepared" | "run";
  executionId: number;
  startTime?: number;
  totalTime?: number;
};

const buildInitialState = (code: string): InternalState => ({
  autorunMode: true,
  renderedCode: "",
  runningState: "none",
  executionId: 0,
  startTime: undefined,
  totalTime: undefined,
});

type Action =
  | {
      type: "SET_AUTORUN_MODE";
      value: boolean;
      code: string;
    }
  | {
      type: "PREPARE_RUN";
    }
  | {
      type: "RUN";
      code: string;
    }
  | {
      type: "STOP_RUN";
    };

const reducer = (state: InternalState, action: Action): InternalState => {
  switch (action.type) {
    case "SET_AUTORUN_MODE":
      return {
        ...state,
        autorunMode: action.value,
      };
    case "PREPARE_RUN":
      return {
        ...state,
        runningState: "prepared",
      };
    case "RUN":
      return {
        ...state,
        runningState: "run",
        renderedCode: action.code,
        executionId: state.executionId + 1,
        startTime: Date.now(),
      };
    case "STOP_RUN":
      return {
        ...state,
        runningState: "none",
        totalTime: state.startTime && Date.now() - state.startTime,
      };
  }
};

// For convenience, this type:
// 1. Contains all necessary data for the playground;
// 2. Matches the Props shape of RunControls comopnent.
export type RunnerState = {
  run: () => void;
  autorunMode: boolean;
  code: string;
  renderedCode: string;
  isRunning: boolean;
  executionId: number;
  executionTime: number | undefined;
  setAutorunMode: (newValue: boolean) => void;
};

export function useRunnerState(code: string): RunnerState {
  const [state, dispatch] = useReducer(reducer, buildInitialState(code));
  const timeoutSetRef = useRef(false); // Ref to track if timeout is already set.

  useLayoutEffect(() => {
    const onFirstExecution = () => state.executionId === 0;
    if (state.runningState === "prepared" && !timeoutSetRef.current) {
      timeoutSetRef.current = true;
      // this is necessary for async playground loading - otherwise it executes the code synchronously on the initial load
      // (it's surprising that this is necessary, but empirically it _is_ necessary, both with `useEffect` and `useLayoutEffect`)
      setTimeout(
        () => {
          dispatch({ type: "RUN", code });
          timeoutSetRef.current = false; // Reset after dispatch.
        },
        onFirstExecution() ? 50 : 0
      );
    } else if (state.runningState === "run") {
      dispatch({ type: "STOP_RUN" });
    }
  }, [state.runningState, code]);

  const run = () => {
    // The rest will be handled by dispatches above on following renders, but we need to update the spinner first.
    dispatch({ type: "PREPARE_RUN" });
  };

  if (
    state.autorunMode &&
    state.renderedCode !== code &&
    state.runningState === "none"
  ) {
    run();
  }

  return {
    run,
    autorunMode: state.autorunMode,
    code,
    renderedCode: state.renderedCode,
    isRunning: state.runningState !== "none",
    executionId: state.executionId,
    executionTime: state.totalTime,
    setAutorunMode: (newValue: boolean) => {
      dispatch({ type: "SET_AUTORUN_MODE", value: newValue, code });
    },
  };
}
