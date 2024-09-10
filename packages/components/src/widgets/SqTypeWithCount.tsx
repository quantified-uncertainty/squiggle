import { FC } from "react";

export const SqTypeWithCount: FC<{
  type: string;
  count: number;
}> = ({ type, count }) => (
  <div className="space-x-1 font-mono text-stone-400">
    <span>{type}</span>
    <span className="font-mono text-sm">{count}</span>
  </div>
);
