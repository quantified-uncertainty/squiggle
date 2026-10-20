import { FC, PropsWithChildren } from "react";

export const FormHeader: FC<PropsWithChildren> = ({ children }) => (
  // No `capitalize`: labels (and their translations) keep their casing.
  <header className="mb-2 font-medium text-gray-500">{children}</header>
);
