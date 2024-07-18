import { FC, PropsWithChildren, useReducer } from "react";

import { ConfirmNavigationModal } from "./ConfirmNavigationModal";
import {
  exitConfirmationReducer,
  ExitConfirmationWrapperContext,
} from "./context";

export const ExitConfirmationWrapper: FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(exitConfirmationReducer, {
    checkers: {},
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
