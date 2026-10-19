import { FC } from "react";

import { CellBox } from "../CellBox.js";

export const ErrorCell: FC<{ error: string }> = ({ error }) => {
  // TODO - truncate?
  return (
    <CellBox>
      <div className="text-xs text-red-500">{error}</div>
    </CellBox>
  );
};
