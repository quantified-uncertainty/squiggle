import { EditorView, hoverTooltip, repositionTooltips } from "@codemirror/view";
import { clsx } from "clsx";
import { FC, PropsWithChildren, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { getFunctionDocumentation } from "@quri/squiggle-lang";
import { SQUIGGLE_DOCS_URL } from "../../lib/constants.js";

type Hover = NonNullable<ReturnType<typeof getFunctionDocumentation>>;

const TooltipSection: FC<PropsWithChildren<{ last?: boolean }>> = ({
  children,
  last,
}) => <div className={clsx("px-4 py-2", last || "border-b")}>{children}</div>;

const HoverTooltip: FC<{ hover: Hover; view: EditorView }> = ({
  hover,
  view,
}) => {
  useEffect(() => {
    // https://codemirror.net/docs/ref/#view.repositionTooltips need to be called on each render.
    repositionTooltips(view);
  });

  const fullName = `${hover.nameSpace}.${hover.name}`;

  return (
    <div className="border bg-slate-50 rounded-sm shadow-lg min-w-[200px]">
      <TooltipSection>
        <div className="flex flex-nowrap items-end justify-between gap-2 py-0.5">
          <a
            // TODO - move domain to constants
            href={`${SQUIGGLE_DOCS_URL}/${hover.nameSpace}#${hover.name}`}
            className="text-blue-500 hover:underline text-sm leading-none"
          >
            {fullName}
          </a>
          <div className="italic text-xs leading-none text-slate-500">
            Stdlib
          </div>
        </div>
      </TooltipSection>
      {hover.description ? (
        <TooltipSection>{hover.description}</TooltipSection>
      ) : null}
      {hover.examples?.length ? (
        <TooltipSection>
          <header className="text-sm text-slate-600 font-medium mb-2">
            Examples
          </header>
          {hover.examples.map((example, i) => (
            <div className="text-xs text-slate-800" key={i}>
              {example}
            </div>
          ))}
        </TooltipSection>
      ) : null}
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
