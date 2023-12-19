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

  // We walk up and backwards through the tree, looking for nodes that have names.

  let direction: "start" | "sibling" | "parent" | undefined = "start";
  while (1) {
    // Only for sibling nodes; `foo = { <cursor> }` shouldn't autocomplete `foo`.
    if (cursor.type.is("Binding") && direction === "sibling") {
      const nameNode = cursor.node.getChild("VariableName");
      if (nameNode) {
        nameNodes.push(nameNode);
      }
      // Only for sibling nodes; Squiggle doesn't support recursive calls.
    } else if (cursor.type.is("FunDeclaration") && direction === "sibling") {
      const nameNode = cursor.node.getChild("FunctionName");
      if (nameNode) {
        nameNodes.push(nameNode);
      }
    } else if (cursor.type.is("FunDeclaration") && direction !== "sibling") {
      const parameterNodes =
        cursor.node.getChild("LambdaArgs")?.getChildren("LambdaParameter") ??
        [];

      for (const parameter of parameterNodes) {
        const nameNode = parameter.getChild("LambdaParameterName");
        if (nameNode) {
          nameNodes.push(nameNode);
        }
      }
    } else if (cursor.type.is("Decorator") && direction !== "sibling") {
      // TODO
    }

    // Move to the next node and store the direction that we used.
    if (cursor.prevSibling()) {
      direction = "sibling";
    } else if (cursor.parent()) {
      direction = "parent";
    } else {
      break;
    }
  }

  return nameNodes;
}

export function makeCompletionSource(project: SqProject) {
  const stdlibCompletions: Completion[] = [];
  const decoratorCompletions: Completion[] = [];

  for (const [name, value] of project.getStdLib().entrySeq()) {
    stdlibCompletions.push({
      label: name,
      type: value.type === "Lambda" ? "function" : "variable",
    });

    if (
      value.type === "Lambda" &&
      value.value.isDecorator &&
      name.startsWith("Tag.")
    ) {
      decoratorCompletions.push({
        label: name.split(".")[1],
        type: "function",
      });
    }
  }

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

    const field = cmpl.tokenBefore([
      "AccessExpr",
      "IdentifierExpr",
      "DecoratorName",
    ]);
    if (!field) {
      return null;
    }
    const { from } = field;

    if (field.type.name === "DecoratorName") {
      return {
        from: field.from,
        options: decoratorCompletions,
      };
    } else {
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
    }

    return null;
  };

  return autocomplete;
}
