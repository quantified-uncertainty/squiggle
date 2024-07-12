import { useRouter } from "next/navigation";
import {
  createContext,
  FC,
  PropsWithChildren,
  Reducer,
  use,
  useCallback,
  useEffect,
  useId,
  useReducer,
} from "react";

import { Button, Modal } from "@quri/ui";

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

const reducer: Reducer<State, Action> = (state, action) => {
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

const NavigationBlockerContext = createContext<{
  state: State;
  dispatch: (action: Action) => void;
}>({
  state: {
    blockers: {},
    interceptedLink: undefined,
  },
  dispatch: () => {},
});

// Be very careful with this hook! `blocker` parameter, if set, must have stable identity.
// If it's an inline function, it will cause an infinite render loop.
export function useBlockNavigation(blocker: () => boolean = () => true) {
  const { dispatch } = use(NavigationBlockerContext);

  const key = useId();

  useEffect(() => {
    dispatch({
      type: "addBlocker",
      payload: {
        key,
        blocker,
      },
    });
    return () => {
      dispatch({
        type: "removeBlocker",
        payload: { key },
      });
    };
  }, [dispatch, key, blocker]);
}

// set `interceptedLink`, show a modal
export function useInterceptLink() {
  const { dispatch } = use(NavigationBlockerContext);

  return useCallback(
    (link: string) => dispatch({ type: "intercept", payload: { link } }),
    [dispatch]
  );
}

// used by `Link` component to detect if intercepting is active
export function useIsIntercepting() {
  const { blockers } = use(NavigationBlockerContext).state;
  return () => Object.values(blockers).some((blocker) => blocker());
}

const InterceptedLinkModal: FC = () => {
  const { state, dispatch } = use(NavigationBlockerContext);
  const close = useCallback(() => {
    dispatch({ type: "clearInterceptedLink" });
  }, [dispatch]);

  const router = useRouter();

  if (!state.interceptedLink) {
    return null;
  }

  return (
    <Modal close={close}>
      <Modal.Header>You have unsaved changes</Modal.Header>
      <Modal.Body>
        Are you sure you want to leave this page? You changes are not saved.
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-end gap-2">
          <Button onClick={() => close()}>Stay on this page</Button>
          <Button
            onClick={() => {
              router.push(state.interceptedLink!);
              close();
            }}
            theme="primary"
          >
            Continue
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export const NavigationBlocker: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    blockers: {},
    interceptedLink: undefined,
  });

  return (
    <NavigationBlockerContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      <InterceptedLinkModal />
      {children}
    </NavigationBlockerContext.Provider>
  );
};
