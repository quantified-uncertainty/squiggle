import { FC, PropsWithChildren } from "react";
import { SearchResultBox } from "./SearchResultBox";

export const NamedSearchResultBox: FC<PropsWithChildren<{ name: string }>> = ({
  name,
  children,
}) => (
  <SearchResultBox>
    <div className="text-sm text-slate-400 capitalize">{name}</div>
    {children}
  </SearchResultBox>
);
