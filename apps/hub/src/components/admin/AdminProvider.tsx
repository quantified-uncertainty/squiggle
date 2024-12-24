"use client";
import { createContext, FC, PropsWithChildren, useState } from "react";

type ContextShape = {
  isAdmin: boolean;
  isAdminMode: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  setIsAdminMode: (mode: boolean) => void;
};

export const AdminContext = createContext<ContextShape>({
  isAdmin: false,
  isAdminMode: false,
  setIsAdmin: () => {},
  setIsAdminMode: () => {},
});

export const AdminProvider: FC<PropsWithChildren> = ({ children }) => {
  // `isAdmin` is initially unknown - we load it dynamically in `WrappedPageMenu` and set to this context.
  // This is done for performance reasons - we want to start rendering the page even while the session is loading.

  // The consequence is that all components that rely on this context will re-render when the session is loaded.

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  return (
    <AdminContext.Provider
      value={{ isAdmin, isAdminMode, setIsAdmin, setIsAdminMode }}
    >
      {children}
    </AdminContext.Provider>
  );
};
