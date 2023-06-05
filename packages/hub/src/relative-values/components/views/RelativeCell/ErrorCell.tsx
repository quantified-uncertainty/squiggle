import { FC } from "react";
import { CellBox } from "../CellBox";

export const ErrorCell: FC<{ error: string }> = ({ error }) => {
  // TODO - truncate?
  return (
    <CellBox>
      <div className="text-red-500 text-xs">{error}</div>
    </CellBox>
  );
};
