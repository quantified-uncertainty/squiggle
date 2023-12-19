import {
  Completion,
  CompletionSource,
  snippetCompletion,
} from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { SyntaxNode, Tree } from "@lezer/common";

import { SqProject } from "@quri/squiggle-lang";

function getNameNodes(tree: Tree, from: number) {
  const cursor = tree.cursorAt(from, -1);
  const nameNodes: SyntaxNode[] = [];

  let direction: "start" | "sibling" | "parent" | undefined = "start";
  while (1) {
    if (cursor.type.is("Binding")) {
      // Only for sibling nodes; `foo = { <cursor> }` shouldn't autocomplete `foo`.
      if (direction === "sibling") {
        const nameNode = cursor.node.getChild("VariableName");
        if (nameNode) {
          nameNodes.push(nameNode);
        }
      }
    } else if (cursor.type.is("FunDeclaration")) {
      // Only for sibling nodes; Squiggle doesn't support recursive calls.
      if (direction === "sibling") {
        const nameNode = cursor.node.getChild("FunctionName");
        if (nameNode) {
          nameNodes.push(nameNode);
        }
      }

      if (direction !== "sibling") {
        const parameterNodes = cursor.node
          .getChild("LambdaArgs")
          ?.getChildren("LambdaParameter");
        if (parameterNodes) {
          for (const parameter of parameterNodes) {
            const nameNode = parameter.getChild("LambdaParameterName");
            if (nameNode) {
              nameNodes.push(nameNode);
            }
          }
        }
      }
    }

    // Move to the next node and store the direction that we used.
    direction = cursor.prevSibling()
      ? "sibling"
      : cursor.parent()
      ? "parent"
      : undefined;

    if (!direction) {
      break;
    }
  }
  return nameNodes;
}

export function makeCompletionSource(project: SqProject) {
  const stdlibCompletions = project
    .getStdLib()
    .entrySeq()
    .toArray()
    .map(
      ([name, value]): Completion => ({
        label: name,
        type: value.type === "Lambda" ? "function" : "variable",
      })
    );

  const autocomplete: CompletionSource = (cmpl) => {
    const tree = syntaxTree(cmpl.state);

    {
      const lambda = cmpl.tokenBefore(["ArgsOpen"]);
      if (lambda) {
        return {
          from: lambda.from,
          options: [
            snippetCompletion("|${args}| ${body}", {
              label: "|",
              detail: "lambda function",
              type: "syntax",
            }),
          ],
        };
      }
    }
    const field = cmpl.tokenBefore(["AccessExpr", "IdentifierExpr"]);
    if (field === null) {
      return null;
    }
    const from = field.from;

    const nameNodes = getNameNodes(tree, from);
    const localCompletions = nameNodes.map((node): Completion => {
      const name = cmpl.state.doc.sliceString(node.from, node.to);
      const type = node.type.is("FunctionName") ? "function" : "variable";
      return {
        label: name,
        type,
      };
    });

    return {
      from,
      options: [...localCompletions, ...stdlibCompletions],
    };
  };

  return autocomplete;
}
