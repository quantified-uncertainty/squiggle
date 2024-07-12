import { use, useCallback, useEffect, useId } from "react";

import { NavigationBlockerContext } from "./context";

// Be very careful with this hook! `blocker` parameter, if set, must have stable identity.
// If it's an inline function, it will cause an infinite render loop:
// - any change in blocker will cause all consumers of this hook to re-render
// - this will cause the blocker to re-create, causing another re-render
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

    const listener = (e: BeforeUnloadEvent) => {
      if (blocker()) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", listener);

    return () => {
      window.removeEventListener("beforeunload", listener);
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
