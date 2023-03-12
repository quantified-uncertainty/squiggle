import { FC } from "react";

export const CellError: FC<{ error: string }> = ({ error }) => {
  // TODO - truncate?
  return <div className="text-red-500 text-xs">{error}</div>;
};
