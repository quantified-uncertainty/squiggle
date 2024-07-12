import { createContext, Reducer } from "react";

type State = {
  // Blockers are functions; this way we can check dynamic parameters such as
  // form values to decide whether navigation should be blocked.
  blockers: Record<string, () => boolean>;
  // Link was intercepted, need to show a modal.
  interceptedLink: string | undefined;
};

type Action =
  | {
      type: "addBlocker";
      payload: {
        key: string;
        blocker: () => boolean;
      };
    }
  | {
      type: "removeBlocker";
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
      type: "clearInterceptedLink";
    };

export const navigationBlockerReducer: Reducer<State, Action> = (
  state,
  action
) => {
  switch (action.type) {
    case "addBlocker":
      return {
        ...state,
        blockers: {
          ...state.blockers,
          [action.payload.key]: action.payload.blocker,
        },
      };
    case "removeBlocker":
      const { [action.payload.key]: _, ...blockers } = state.blockers;
      return { ...state, blockers };
    case "intercept":
      return { ...state, interceptedLink: action.payload.link };
    case "clearInterceptedLink":
      return { ...state, interceptedLink: undefined };
    default:
      return state;
  }
};

export const NavigationBlockerContext = createContext<{
  state: State;
  dispatch: (action: Action) => void;
}>({
  state: {
    blockers: {},
    interceptedLink: undefined,
  },
  dispatch: () => {},
});
