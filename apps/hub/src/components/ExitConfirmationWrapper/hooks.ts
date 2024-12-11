import { use, useCallback, useEffect, useId } from "react";

import { ExitConfirmationWrapperContext } from "./context";

/*
 * Be very careful with this hook! `check` parameter, if set, must have stable identity.
 *
 * If it's an inline function, it will cause an infinite render loop:
 * - any change in the check function will cause all consumers of this hook to re-render
 * - this will cause the check function to re-create, causing another re-render.
 */
export function useExitConfirmation(check: () => boolean = () => true) {
  const { dispatch } = use(ExitConfirmationWrapperContext);

  const key = useId();

  useEffect(() => {
    dispatch({
      type: "addExitConfirmationCheck",
      payload: {
        key,
        check,
      },
    });

    const listener = (e: BeforeUnloadEvent) => {
      if (check()) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", listener);

    return () => {
      window.removeEventListener("beforeunload", listener);
      dispatch({
        type: "removeExitConfirmationCheck",
        payload: { key },
      });
    };
  }, [dispatch, key, check]);
}

// set `pendingLink`, show a modal
export function useConfirmNavigation() {
  const { dispatch } = use(ExitConfirmationWrapperContext);

  return useCallback(
    (link: string) => dispatch({ type: "intercept", payload: { link } }),
    [dispatch]
  );
}

// used by `Link` component to detect if exit confirmation is active
export function useIsExitConfirmationActive() {
  const { checks: blockers } = use(ExitConfirmationWrapperContext).state;
  return () => Object.values(blockers).some((check) => check());
}
