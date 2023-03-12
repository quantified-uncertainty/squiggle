import { FC } from "react";

export const ErrorCell: FC<{ error: string }> = ({ error }) => {
  // TODO - truncate?
  return <div className="text-red-500 text-xs">{error}</div>;
};
