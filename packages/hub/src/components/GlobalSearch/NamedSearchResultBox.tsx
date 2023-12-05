import { FC, PropsWithChildren } from "react";

export const NamedSearchResultBox: FC<PropsWithChildren<{ name: string }>> = ({
  name,
  children,
}) => (
  <div>
    <div className="text-sm text-slate-400 capitalize">{name}</div>
    <div className="text-sm">{children}</div>
  </div>
);
