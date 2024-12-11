import { FC, PropsWithChildren, useReducer } from "react";

import { ConfirmNavigationModal } from "./ConfirmNavigationModal";
import {
  exitConfirmationReducer,
  ExitConfirmationWrapperContext,
} from "./context";

/*
 * This component wraps the application and provides the context for exit
 * confirmation when some component in the tree below requires it.
 *
 * There are two types of exits:
 * 1. Navigation to another page.
 * 2. Closing the tab.
 *
 * To enable exit confirmation, use the `useExitConfirmation` hook.
 *
 * It will set up the `beforeunload` event listener and register the check.
 *
 * On navigation, `<Link>` component will check if there are any active checks,
 * and activate the confirmation modal if necessary.
 */
export const ExitConfirmationWrapper: FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(exitConfirmationReducer, {
    checks: {},
    pendingLink: undefined,
  });

  return (
    <ExitConfirmationWrapperContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      <ConfirmNavigationModal />
      {children}
    </ExitConfirmationWrapperContext.Provider>
  );
};
