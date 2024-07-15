import { FC, PropsWithChildren } from "react";

export const NodeLabel: FC<
  PropsWithChildren<{ type: string; hash?: string }>
> = ({ type, hash, children }) => {
  return (
    <div className="text-left">
      <div className="flex gap-1">
        <div className="font-medium text-slate-500">{type}</div>
        {hash && <div className="text-slate-500">{hash.substring(0, 7)}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};
