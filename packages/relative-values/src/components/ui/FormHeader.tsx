import { FC, PropsWithChildren } from "react";

export const FormHeader: FC<PropsWithChildren> = ({ children }) => (
  <header className="text-gray-500 capitalize font-medium mb-2">
    {children}
  </header>
);
