import { syntaxTree } from "@codemirror/language";
import { EditorView, hoverTooltip } from "@codemirror/view";
import { SyntaxNode } from "@lezer/common";
import { ReactNode } from "react";

import { getFunctionDocumentation } from "@quri/squiggle-lang";

import {
  projectFacet,
  renderImportTooltipFacet,
  sourceIdFacet,
} from "../fields.js";
import { reactAsDom } from "../utils.js";
import { HoverTooltip } from "./HoverTooltip.js";
import { TooltipBox } from "./TooltipBox.js";
import { ValueTooltip } from "./ValueTooltip.js";

function nodeTooltip(syntaxNode: SyntaxNode, reactNode: ReactNode) {
  return {
    pos: syntaxNode.from,
    end: syntaxNode.to,
    above: true,
    create: () => reactAsDom(reactNode),
  };
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

export function tooltipsExtension() {
  // Based on https://codemirror.net/examples/tooltip/#hover-tooltips
  // See also: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_hover
  const hoverExtension = hoverTooltip((view, pos, side) => {
    const renderImportTooltip = view.state.facet(renderImportTooltipFacet);
    const project = view.state.facet(projectFacet);
    const sourceId = view.state.facet(sourceIdFacet);

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
      case "String": {
        // Is this an import?
        if (!cursor.parent()) {
          return null;
        }
        if (cursor.type.is("ImportName") && renderImportTooltip) {
          const importId = getText(cursor.node).slice(1, -1);
          return nodeTooltip(
            cursor.node,
            <TooltipBox view={view}>
              {renderImportTooltip({ project, importId })}
            </TooltipBox>
          );
        }
        break;
      }
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

        const name = getText(node);
        if (cursor.type.is("Import")) {
          const output = project.getOutput(sourceId);
          if (!output.ok) return null;

          const value = output.value.imports.get(name);
          if (!value) return null;

          return nodeTooltip(node, <ValueTooltip value={value} view={view} />);
        } else if (cursor.type.is("Statement")) {
          // Ascend through decorated statements.
          while (cursor.type.is("Statement") && cursor.parent());

          // Is this a top-level variable?
          if (!cursor.type.is("Program")) {
            return null;
          }

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
            (valueAst.kind === "LetStatement" ||
              valueAst.kind === "DefunStatement") &&
            // If these don't match then variable was probably shadowed by a later statement and we can't show its value.
            // Or it could be caused by code rot, if we change the logic of how `valueAst` is computed, or add another statement type in AST.
            // TODO - if we can prove that the variable was shadowed, show the tooltip pointing to the latest assignment.
            valueAst.variable.location.start.offset === node.from &&
            valueAst.variable.location.end.offset === node.to
          ) {
            return nodeTooltip(
              node,
              <ValueTooltip value={value} view={view} />
            );
          }
        }
      }
    }

    return null;
  });

  return [hoverExtension, tooltipTheme];
}
