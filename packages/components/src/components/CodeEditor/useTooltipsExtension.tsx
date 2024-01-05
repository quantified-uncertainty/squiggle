import { EditorView, hoverTooltip, repositionTooltips } from "@codemirror/view";
import { FC, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { getFunctionDocumentation } from "@quri/squiggle-lang";

import { FnDocumentation } from "../ui/FnDocumentation.js";

type Hover = NonNullable<ReturnType<typeof getFunctionDocumentation>>;

const HoverTooltip: FC<{ hover: Hover; view: EditorView }> = ({
  hover,
  view,
}) => {
  useEffect(() => {
    // https://codemirror.net/docs/ref/#view.repositionTooltips need to be called on each render.
    repositionTooltips(view);
  });

  return (
    <div className="border rounded-sm shadow-lg min-w-[200px] max-w-[600px] px-2">
      <FnDocumentation documentation={hover} />
    </div>
  );
};

// Based on https://codemirror.net/examples/tooltip/#hover-tooltips
// See also: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_hover
const wordHover = hoverTooltip((view, pos, side) => {
  const { doc } = view.state;
  const { from, to, text } = doc.lineAt(pos);
  let start = pos,
    end = pos;
  while (start > from && /[\w.]/.test(text[start - from - 1])) start--;
  while (end < to && /[\w.]/.test(text[end - from])) end++;
  if ((start === pos && side < 0) || (end === pos && side > 0)) return null;

  const token = text.slice(start - from, end - from);
  const hover = getFunctionDocumentation(token);
  if (!hover) {
    return null;
  }

  return {
    pos: start,
    end,
    above: true,
    create() {
      const dom = document.createElement("div");
      const root = createRoot(dom);
      root.render(<HoverTooltip hover={hover} view={view} />);
      return { dom };
    },
  };
});

const tooltipTheme = EditorView.baseTheme({
  ".cm-tooltip-hover": {
    backgroundColor: "white !important",
    border: "0 !important",
  },
});

export function useTooltipsExtension() {
  return [wordHover, tooltipTheme];
}
