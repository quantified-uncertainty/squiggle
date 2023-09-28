import { FC, PropsWithChildren } from "react";

export const DropdownMenuHeader: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="px-2 py-1.5 text-sm font-semibold bg-slate-100">
      {children}
    </div>
  );
};
