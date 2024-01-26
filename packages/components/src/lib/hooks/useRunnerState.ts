import { useReducer } from "react";

type InternalState = {
  renderedCode: string;
  executionId: number;
};

const buildInitialState = (): InternalState => ({
  renderedCode: "",
  executionId: 0,
});

type Action = {
  type: "RUN";
  code: string;
};

const reducer = (state: InternalState, action: Action): InternalState => {
  switch (action.type) {
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
  // code: string;
  renderedCode: string;
  executionId: number;
};

export function useRunnerState(
  code: string,
  autorunMode: boolean
): RunnerState {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  const run = () => {
    dispatch({ type: "RUN", code });
  };

  if (autorunMode && state.renderedCode !== code) {
    run();
  }

  return {
    run: run,
    renderedCode: state.renderedCode,
    executionId: state.executionId,
  };
}
