import { FC, PropsWithChildren } from "react";

export const SearchResultTitle: FC<PropsWithChildren> = ({ children }) => (
  <div className="text-slate-700 font-medium">{children}</div>
);
