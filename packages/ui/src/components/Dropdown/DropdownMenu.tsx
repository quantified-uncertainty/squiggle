import { FC, PropsWithChildren } from "react";

export const DropdownMenu: FC<PropsWithChildren> = ({ children }) => {
  return <div className="p-1 w-56">{children}</div>;
};
