import { FC, PropsWithChildren } from "react";

export const SearchResultBox: FC<PropsWithChildren<{ name: string }>> = ({
  name,
  children,
}) => (
  <div>
    <div className="text-sm capitalize text-slate-400">{name}</div>
    <div className="text-sm">{children}</div>
  </div>
);
