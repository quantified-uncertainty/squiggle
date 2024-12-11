import { FC, PropsWithChildren } from "react";

export const SearchResultTitle: FC<PropsWithChildren> = ({ children }) => (
  <div className="font-medium text-slate-700">{children}</div>
);
