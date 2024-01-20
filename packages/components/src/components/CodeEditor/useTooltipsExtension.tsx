import { syntaxTree } from "@codemirror/language";
import { EditorView, hoverTooltip, repositionTooltips } from "@codemirror/view";
import { SyntaxNode } from "@lezer/common";
import { FC, PropsWithChildren, ReactNode, useEffect } from "react";

import {
  getFunctionDocumentation,
  SqProject,
  SqValue,
} from "@quri/squiggle-lang";

import { valueHasContext } from "../../lib/utility.js";
import { SquiggleValueChart } from "../SquiggleViewer/SquiggleValueChart.js";
import {
  InnerViewerProvider,
  useViewerContext,
} from "../SquiggleViewer/ViewerProvider.js";
import { FnDocumentation } from "../ui/FnDocumentation.js";
import { useReactiveExtension } from "./codemirrorHooks.js";
import { reactAsDom } from "./utils.js";

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
    <div className="border rounded-sm shadow-lg h-full overflow-y-auto">
      {children}
    </div>
  );
};

const ValueTooltip: FC<{ value: SqValue; view: EditorView }> = ({
  value,
  view,
}) => {
  const { globalSettings } = useViewerContext();

  if (valueHasContext(value)) {
    return (
      <TooltipBox view={view}>
        <div className="px-4 py-1">
          {/* Force a standalone ephemeral ViewerProvider, so that we won't sync up collapsed state with the top-level viewer */}
          <InnerViewerProvider
            partialPlaygroundSettings={globalSettings}
            viewerType="tooltip"
          >
            <SquiggleValueChart value={value} settings={globalSettings} />
          </InnerViewerProvider>
        </div>
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
    <div className="min-w-[200px] max-w-[600px] px-2">
      <FnDocumentation documentation={hover} />
    </div>
  </TooltipBox>
);

function nodeTooltip(syntaxNode: SyntaxNode, reactNode: ReactNode) {
  return {
    pos: syntaxNode.from,
    end: syntaxNode.to,
    above: true,
    create: () => reactAsDom(reactNode),
  };
}

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

      return nodeTooltip(node, <HoverTooltip hover={hover} view={view} />);
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
        if (!cursor.type.is("Program")) {
          return null;
        }

        const name = getText(node);

        const bindings = project.getBindings(sourceId);
        if (!bindings.ok) return null;

        const value = bindings.value.get(name);
        if (!value) return null;

        // Should be a statement
        const valueAst = value.context?.valueAst;

        if (!valueAst) {
          return null;
        }

        if (
          // Note that `valueAst` can't be "DecoratedStatement", we skip those in `SqValueContext` and AST symbols
          (valueAst.type === "LetStatement" ||
            valueAst.type === "DefunStatement") &&
          // If these don't match then variable was probably shadowed by a later statement and we can't show its value.
          // Or it could be caused by code rot, if we change the logic of how `valueAst` is computed, or add another statement type in AST.
          // TODO - if we can prove that the variable was shadowed, show the tooltip pointing to the latest assignment.
          valueAst.variable.location.start.offset === node.from &&
          valueAst.variable.location.end.offset === node.to
        ) {
          return nodeTooltip(node, <ValueTooltip value={value} view={view} />);
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
  ".cm-tooltip-section": {
    height: "100%", // necessary for scrolling, see also: "h-full" in `TooltipBox`
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
