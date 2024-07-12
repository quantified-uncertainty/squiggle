import { FC, PropsWithChildren, useReducer } from "react";

import { NavigationBlockerContext, navigationBlockerReducer } from "./context";
import { InterceptedLinkModal } from "./InterceptedLinkModal";

export const NavigationBlockerProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(navigationBlockerReducer, {
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
