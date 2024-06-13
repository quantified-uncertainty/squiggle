import { EditorView } from "@codemirror/view";
import { FC } from "react";

import { getFunctionDocumentation } from "@quri/squiggle-lang";

import { FnDocumentation } from "../../ui/FnDocumentation.js";
import { TooltipBox } from "./TooltipBox.js";

type Hover = NonNullable<ReturnType<typeof getFunctionDocumentation>>;
export const HoverTooltip: FC<{ hover: Hover; view: EditorView }> = ({
  hover,
  view,
}) => (
  <TooltipBox view={view}>
    <div className="min-w-[200px] max-w-[600px] px-2">
      <FnDocumentation documentation={hover} />
    </div>
  </TooltipBox>
);
