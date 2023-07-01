import { useReducer } from "react";

type InternalState = {
  autorunMode: boolean;
  renderedCode: string;
  executionId: number;
};

const buildInitialState = (): InternalState => ({
  autorunMode: true,
  renderedCode: "",
  executionId: 0,
});

type Action =
  | {
      type: "SET_AUTORUN_MODE";
      value: boolean;
      code: string;
    }
  | {
      type: "RUN";
      code: string;
    };

const reducer = (state: InternalState, action: Action): InternalState => {
  switch (action.type) {
    case "SET_AUTORUN_MODE":
      return {
        ...state,
        autorunMode: action.value,
      };
    case "RUN":
      return {
        ...state,
        renderedCode: action.code,
        executionId: state.executionId + 1,
      };
  }
};

// For convenience, this type:
// 1. Contains all necessary data for the playground;
// 2. Matches the Props shape of RunControls component.
export type RunnerState = {
  run: () => void;
  autorunMode: boolean;
  code: string;
  renderedCode: string;
  executionId: number;
  setAutorunMode: (newValue: boolean) => void;
};

export function useRunnerState(code: string): RunnerState {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  const run = () => {
    dispatch({ type: "RUN", code });
  };

  if (state.autorunMode && state.renderedCode !== code) {
    run();
  }

  return {
    run,
    autorunMode: state.autorunMode,
    code,
    renderedCode: state.renderedCode,
    executionId: state.executionId,
    setAutorunMode: (newValue: boolean) => {
      dispatch({ type: "SET_AUTORUN_MODE", value: newValue, code });
    },
  };
}
