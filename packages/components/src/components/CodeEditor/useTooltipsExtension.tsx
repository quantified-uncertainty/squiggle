import { syntaxTree } from "@codemirror/language";
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
    <div className="border bg-slate-50 rounded-sm shadow-lg min-w-[200px] max-w-[600px]">
      <FnDocumentation documentation={hover} />
    </div>
  );
};

// Based on https://codemirror.net/examples/tooltip/#hover-tooltips
// See also: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_hover
const wordHover = hoverTooltip((view, pos, side) => {
  const { doc } = view.state;

  const tree = syntaxTree(view.state);
  const cursor = tree.cursorAt(pos, side);

  const getText = () => doc.sliceString(cursor.node.from, cursor.node.to);

  switch (cursor.name) {
    case "IdentifierExpr":
      if (getText().match(/^[A-Z]/)) {
        // TODO - expand the namespace to the identifier, or just show the namespace documentation
        return null;
      }
      // TODO - check that the identifier is not overwritten by a local variable
      break; // this is ok, might be a builtin
    case "Field": {
      if (!cursor.parent()) {
        return null;
      }
      break;
    }
    default:
      return null;
  }

  const hover = getFunctionDocumentation(getText());
  if (!hover) {
    return null;
  }

  return {
    pos: cursor.node.from,
    end: cursor.node.to,
    above: true,
    create() {
      const dom = document.createElement("div");
      const root = createRoot(dom);
      root.render(<HoverTooltip hover={hover} view={view} />);
      return { dom };
    },
  };
  return null;
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
