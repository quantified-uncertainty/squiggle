import { createContext, Reducer } from "react";

type State = {
  // Checks are functions; this way we can check dynamic parameters such as
  // form values to decide whether navigation should be intercepted.
  // If any of the checks returns a true value, the exit confirmation will be shown.
  checks: Record<string, () => boolean>;
  // Link was intercepted, need to show a modal.
  pendingLink: string | undefined;
};

type Action =
  | {
      type: "addExitConfirmationCheck";
      payload: {
        key: string;
        check: () => boolean;
      };
    }
  | {
      type: "removeExitConfirmationCheck";
      payload: {
        key: string;
      };
    }
  | {
      type: "intercept";
      payload: {
        link: string;
      };
    }
  | {
      type: "clearPendingLink";
    };

export const exitConfirmationReducer: Reducer<State, Action> = (
  state,
  action
) => {
  switch (action.type) {
    case "addExitConfirmationCheck":
      return {
        ...state,
        checks: {
          ...state.checks,
          [action.payload.key]: action.payload.check,
        },
      };
    case "removeExitConfirmationCheck":
      const { [action.payload.key]: _, ...blockers } = state.checks;
      return { ...state, checks: blockers };
    case "intercept":
      return { ...state, pendingLink: action.payload.link };
    case "clearPendingLink":
      return { ...state, pendingLink: undefined };
    default:
      return state;
  }
};

export const ExitConfirmationWrapperContext = createContext<{
  state: State;
  dispatch: (action: Action) => void;
}>({
  state: {
    checks: {},
    pendingLink: undefined,
  },
  dispatch: () => {},
});
