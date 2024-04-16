import { FC, PropsWithChildren } from "react";

export const FormHeader: FC<PropsWithChildren> = ({ children }) => (
  <header className="mb-2 font-medium capitalize text-gray-500">
    {children}
  </header>
);
