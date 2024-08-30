import { FC } from "react";

import { Type } from "@quri/squiggle-lang";

export const ShowType: FC<{ type: Type }> = ({ type }) => {
  return (
    // TODO - traverse type recursively, with colors and indentation
    <div className="max-w-80 font-mono text-xs text-slate-600">
      {type.toString()}
    </div>
  );
};
