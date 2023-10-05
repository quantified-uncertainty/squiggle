import { FC, PropsWithChildren } from "react";

export const DropdownMenu: FC<PropsWithChildren> = ({ children }) => {
  return <div className="w-56">{children}</div>;
};
