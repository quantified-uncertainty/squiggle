import { useLayoutEffect, useReducer } from "react";

type State = {
  autorunMode: boolean;
  renderedCode: string;
  // "prepared" is for rendering a spinner; "run" for executing squiggle code; then it gets back to "none" on the next render
  runningState: "none" | "prepared" | "run";
  executionId: number;
};

const buildInitialState = (code: string): State => ({
  autorunMode: true,
  renderedCode: "",
  runningState: "none",
  executionId: 1,
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

const reducer = (state: State, action: Action): State => {
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
      };
    case "STOP_RUN":
      return {
        ...state,
        runningState: "none",
      };
  }
};

export const useRunnerState = (code: string) => {
  const [state, dispatch] = useReducer(reducer, buildInitialState(code));

  useLayoutEffect(() => {
    if (state.runningState === "prepared") {
      // this is necessary for async playground loading - otherwise it executes the code synchronously on the initial load
      // (it's surprising that this is necessary, but empirically it _is_ necessary, both with `useEffect` and `useLayoutEffect`)
      setTimeout(() => {
        dispatch({ type: "RUN", code });
      }, 0);
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
    renderedCode: state.renderedCode,
    isRunning: state.runningState !== "none",
    executionId: state.executionId,
    setAutorunMode: (newValue: boolean) => {
      dispatch({ type: "SET_AUTORUN_MODE", value: newValue, code });
    },
  };
};
