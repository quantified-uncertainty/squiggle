import { createContext, Reducer } from "react";

/*
 * There are two types of exits:
 * 1. Navigation to another page.
 * 2. Closing the tab.
 */
type State = {
  // Checkers are functions; this way we can check dynamic parameters such as
  // form values to decide whether navigation should be intercepted.
  // If any of the checkers returns a true value, the exit confirmation will be shown.
  checkers: Record<string, () => boolean>;
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
        checkers: {
          ...state.checkers,
          [action.payload.key]: action.payload.check,
        },
      };
    case "removeExitConfirmationCheck":
      const { [action.payload.key]: _, ...blockers } = state.checkers;
      return { ...state, checkers: blockers };
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
    checkers: {},
    pendingLink: undefined,
  },
  dispatch: () => {},
});
