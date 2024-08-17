import { syntaxTree } from "@codemirror/language";
import { EditorView, hoverTooltip } from "@codemirror/view";
import { SyntaxNode } from "@lezer/common";
import { ReactNode } from "react";

import { getFunctionDocumentation } from "@quri/squiggle-lang";

import { mainHeadName } from "../../../lib/hooks/useSimulator.js";
import {
  projectFacet,
  renderImportTooltipFacet,
  simulationFacet,
} from "../fields.js";
import { reactAsDom } from "../utils.js";
import { HoverTooltip } from "./HoverTooltip.js";
import { TooltipBox } from "./TooltipBox.js";
import { TypeTooltip } from "./TypeTooltip.js";
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
    const simulation = view.state.facet(simulationFacet);
    const project = view.state.facet(projectFacet);

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

    const createTypeTooltip = (node: SyntaxNode) => {
      // TODO - pass head name through facet
      if (!project.hasHead(mainHeadName)) {
        return null;
      }
      const module = project.getHead(mainHeadName);
      const astR = module.typedAst();
      if (!astR.ok) {
        return null;
      }

      const ast = astR.value;
      const astNode = ast.findDescendantByLocation(node.from, node.to);

      if (astNode?.isExpression() || astNode?.kind === "IdentifierDefinition") {
        return nodeTooltip(
          node,
          <TypeTooltip type={astNode.type} view={view} />
        );
      } else {
        return null;
      }
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
      case "Identifier": {
        if (getText(cursor.node).match(/^[A-Z]/)) {
          // TODO - expand the namespace to the identifier, or just show the namespace documentation
          return null;
        }
        // TODO - check that the identifier is not overwritten by a local variable
        return (
          createBuiltinTooltip(cursor.node) ?? createTypeTooltip(cursor.node)
        );
      }
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
        if (!simulation) return null;
        if (!simulation.output.result.ok) return null;
        const output = simulation.output.result.value;

        if (cursor.type.is("Import")) {
          const value = output.imports.get(name);
          if (!value) return null;

          return nodeTooltip(node, <ValueTooltip value={value} view={view} />);
        } else if (cursor.type.is("Statement")) {
          // Ascend to the parent scope; is this a top-level variable?
          cursor.parent();
          if (!cursor.type.is("Program")) {
            // Not a top-level variable, but we can still show its type.
            return createTypeTooltip(node);
          }

          const value = output.bindings.get(name);
          if (!value) return null;

          // Should be a statement
          const valueAst = value.context?.valueAst;

          if (!valueAst) {
            return null;
          }

          if (
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
