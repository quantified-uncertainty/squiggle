import { EditorView } from "@codemirror/view";
import { FC } from "react";

import { Type } from "@quri/squiggle-lang";

import { ShowType } from "./ShowType.js";
import { TooltipBox } from "./TooltipBox.js";

export const TypeTooltip: FC<{ type: Type; view: EditorView }> = ({
  type,
  view,
}) => {
  return (
    <TooltipBox view={view}>
      <div className="px-4 py-1">
        <ShowType type={type} />
      </div>
    </TooltipBox>
  );
};
