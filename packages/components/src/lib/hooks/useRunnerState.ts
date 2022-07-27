import { useEffect, useReducer } from "react";

type State = {
  autorunMode: boolean;
  renderedCode: string;
  isRunning: boolean;
  executionId: number;
};

const buildInitialState = (code: string) => ({
  autorunMode: true,
  renderedCode: code,
  isRunning: false,
  executionId: 0,
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
        isRunning: true,
      };
    case "RUN":
      return {
        ...state,
        renderedCode: action.code,
        executionId: state.executionId + 1,
      };
    case "STOP_RUN":
      return {
        ...state,
        isRunning: false,
      };
  }
};

export const useRunnerState = (code: string) => {
  const [state, dispatch] = useReducer(reducer, buildInitialState(code));

  useEffect(() => {
    if (state.isRunning) {
      if (state.renderedCode !== code) {
        dispatch({ type: "RUN", code });
      } else {
        dispatch({ type: "STOP_RUN" });
      }
    }
  }, [state.isRunning, state.renderedCode, code]);

  const run = () => {
    // The rest will be handled by dispatches above on following renders, but we need to update the spinner first.
    dispatch({ type: "PREPARE_RUN" });
  };

  if (state.autorunMode && state.renderedCode !== code && !state.isRunning) {
    run();
  }

  return {
    run,
    autorunMode: state.autorunMode,
    renderedCode: state.renderedCode,
    isRunning: state.isRunning,
    executionId: state.executionId,
    setAutorunMode: (newValue: boolean) => {
      dispatch({ type: "SET_AUTORUN_MODE", value: newValue, code });
    },
  };
};
