import { syntaxTree } from "@codemirror/language";
import { EditorView, hoverTooltip, repositionTooltips } from "@codemirror/view";
import { SyntaxNode } from "@lezer/common";
import { FC, PropsWithChildren, useEffect } from "react";
import { createRoot } from "react-dom/client";

import {
  getFunctionDocumentation,
  SqProject,
  SqValue,
} from "@quri/squiggle-lang";

import { valueHasContext } from "../../lib/utility.js";
import { defaultPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleValueChart } from "../SquiggleViewer/SquiggleValueChart.js";
import { FnDocumentation } from "../ui/FnDocumentation.js";
import { useReactiveExtension } from "./codemirrorHooks.js";

type Hover = NonNullable<ReturnType<typeof getFunctionDocumentation>>;

const TooltipBox: FC<PropsWithChildren<{ view: EditorView }>> = ({
  view,
  children,
}) => {
  useEffect(() => {
    // https://codemirror.net/docs/ref/#view.repositionTooltips needs to be called on each render.
    repositionTooltips(view);
  });

  return (
    <div className="border bg-slate-50 rounded-sm shadow-lg min-w-[200px] max-w-[600px]">
      {children}
    </div>
  );
};

const ValueTooltip: FC<{ value: SqValue; view: EditorView }> = ({
  value,
  view,
}) => {
  if (valueHasContext(value)) {
    return (
      <TooltipBox view={view}>
        <SquiggleValueChart
          value={value}
          settings={defaultPlaygroundSettings} // FIXME - should be passed through <CodeEditor>
        />
      </TooltipBox>
    );
  } else {
    return null; // shouldn't happen
  }
};

const HoverTooltip: FC<{ hover: Hover; view: EditorView }> = ({
  hover,
  view,
}) => (
  <TooltipBox view={view}>
    <FnDocumentation documentation={hover} />
  </TooltipBox>
);

// Based on https://codemirror.net/examples/tooltip/#hover-tooltips
// See also: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_hover
function buildWordHoverExtension({
  project,
  sourceId,
}: {
  project: SqProject;
  sourceId: string;
}) {
  return hoverTooltip((view, pos, side) => {
    const { doc } = view.state;

    const tree = syntaxTree(view.state);
    const cursor = tree.cursorAt(pos, side);

    const getText = (node: SyntaxNode) => doc.sliceString(node.from, node.to);

    const createBuiltinTooltip = (node: SyntaxNode) => {
      const hover = getFunctionDocumentation(getText(node));
      if (!hover) {
        return null;
      }

      return {
        pos: node.from,
        end: node.to,
        above: true,
        create() {
          const dom = document.createElement("div");
          const root = createRoot(dom);
          root.render(<HoverTooltip hover={hover} view={view} />);
          return { dom };
        },
      };
    };

    const createTopLevelVariableNameTooltip = (node: SyntaxNode) => {
      const name = getText(node);

      const bindings = project.getBindings(sourceId);
      if (!bindings.ok) return null;

      const value = bindings.value.get(name);
      if (!value) return null;

      return {
        pos: node.from,
        end: node.to,
        above: true,
        create() {
          const dom = document.createElement("div");
          const root = createRoot(dom);
          root.render(<ValueTooltip value={value} view={view} />);
          return { dom };
        },
      };
    };

    switch (cursor.name) {
      case "Identifier":
        if (getText(cursor.node).match(/^[A-Z]/)) {
          // TODO - expand the namespace to the identifier, or just show the namespace documentation
          return null;
        }
        // TODO - check that the identifier is not overwritten by a local variable
        return createBuiltinTooltip(cursor.node);
      case "Field":
        // `Namespace.function`; go up to fully identified name.
        if (!cursor.parent()) {
          return null;
        }
        return createBuiltinTooltip(cursor.node);
      case "VariableName": {
        const node = cursor.node;

        // Let's find the statement that declares this variable.
        if (!cursor.parent()) {
          return null;
        }
        // Ascend through decorated statements.
        while (cursor.type.is("Statement") && cursor.parent());

        // Is this a top-level variable?
        if (cursor.type.is("Program")) {
          return createTopLevelVariableNameTooltip(node);
        }
      }
    }

    return null;
  });
}

const tooltipTheme = EditorView.baseTheme({
  ".cm-tooltip-hover": {
    backgroundColor: "white !important",
    border: "0 !important",
  },
});

export function useTooltipsExtension(
  view: EditorView | undefined,
  {
    project,
    sourceId,
  }: {
    project: SqProject;
    sourceId: string;
  }
) {
  return useReactiveExtension(
    view,
    () => [buildWordHoverExtension({ project, sourceId }), tooltipTheme],
    [project, sourceId]
  );
}
