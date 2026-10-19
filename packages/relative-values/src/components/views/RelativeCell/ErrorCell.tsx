import { FC } from "react";

import { CellBox } from "../CellBox.js";

export const ErrorCell: FC<{ error: string }> = ({ error }) => {
  return (
    <CellBox>
      <div className="text-xs text-red-700" title={error} data-rv-error-cell="">
        {error}
      </div>
    </CellBox>
  );
};
