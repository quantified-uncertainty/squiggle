import { EditorView } from "@codemirror/view";
import { FC } from "react";

import { Type } from "@quri/squiggle-lang";

import { TooltipBox } from "./TooltipBox.js";

export const TypeTooltip: FC<{ type: Type; view: EditorView }> = ({
  type,
  view,
}) => {
  return (
    <TooltipBox view={view}>
      <div className="px-4 py-1 font-mono text-xs text-slate-600">
        {type.toString()}
      </div>
    </TooltipBox>
  );
};
