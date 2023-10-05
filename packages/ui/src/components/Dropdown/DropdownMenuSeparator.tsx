import { FC, PropsWithChildren } from "react";

export const DropdownMenuSeparator: FC<PropsWithChildren> = ({ children }) => {
  return <div className="-mx-1 my-1 h-px bg-slate-200">{children}</div>;
};
