import {
  Completion,
  CompletionSource,
  snippetCompletion,
} from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { SyntaxNode, Tree } from "@lezer/common";

import { SqProject } from "@quri/squiggle-lang";

import { FnDocumentationFromName } from "../../ui/FnDocumentation.js";
import { reactAsDom } from "../utils.js";

type NameNode = {
  node: SyntaxNode;
  type: "function" | "variable";
};

export function getNameNodes(tree: Tree, from: number): NameNode[] {
  const cursor = tree.cursorAt(from, -1);
  const nameNodes: NameNode[] = [];

  // We walk up and backwards through the tree, looking for nodes that have names.

  let direction: "start" | "sibling" | "parent" | undefined = "start";
  while (1) {
    if (cursor.type.is("Statement") && direction === "sibling") {
      // Only for sibling nodes; `foo = { <cursor> }` shouldn't autocomplete `foo`.

      // Unwrap decorated statements.
      let node: SyntaxNode | null = cursor.node;
      while (node && node.type.is("DecoratedStatement")) {
        node = node.getChild("Statement");
      }

      const nameNode = node?.getChild("VariableName");
      if (node && nameNode) {
        nameNodes.push({
          node: nameNode,
          type: node?.type.is("DefunStatement") ? "function" : "variable",
        });
      }
    } else if (cursor.type.is("DefunStatement") && direction !== "sibling") {
      // Function declaration that's a parent, let's autocomplete its parameter names.
      // Note that we also allow `direction === "start"`, to handle `f(foo) = foo` correctly.
      const parameterNodes =
        cursor.node.getChild("LambdaArgs")?.getChildren("LambdaParameter") ??
        [];

      for (const parameter of parameterNodes) {
        const nameNode = parameter.getChild("LambdaParameterName");
        if (nameNode) {
          nameNodes.push({
            node: nameNode,
            // Is there a more specific type? There's no "parameter" type in CodeMirror.
            // https://codemirror.net/docs/ref/#autocomplete.Completion.type
            type: "variable",
          });
        }
      }
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

  const getInfoFunction = (name: string): Completion["info"] => {
    return () => reactAsDom(<FnDocumentationFromName functionName={name} />);
  };

  for (const [name, value] of project.getStdLib().entrySeq()) {
    stdlibCompletions.push({
      label: name,
      info: getInfoFunction(name),
      type: value.type === "Lambda" ? "function" : "variable",
    });

    if (
      value.type === "Lambda" &&
      value.value.isDecorator &&
      name.startsWith("Tag.")
    ) {
      const shortName = name.split(".")[1];
      decoratorCompletions.push({
        label: `@${shortName}`,
        apply: shortName,
        info: getInfoFunction(name),
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
              type: "text",
            }),
          ],
        };
      }
    }

    {
      const identifier = cmpl.tokenBefore(["AccessExpr", "Identifier"]);
      if (identifier) {
        const { from } = identifier;
        const nameNodes = getNameNodes(tree, from);
        const localCompletions = nameNodes.map((nameNode): Completion => {
          const name = cmpl.state.doc.sliceString(
            nameNode.node.from,
            nameNode.node.to
          );
          return {
            label: name,
            type: nameNode.type,
          };
        });

        return {
          from,
          options: [...localCompletions, ...stdlibCompletions],
        };
      }
    }

    {
      const decorator = cmpl.tokenBefore(["DecoratorName"]);
      if (decorator) {
        return {
          from: decorator.from,
          options: decoratorCompletions,
        };
      }
    }

    return null;
  };

  return autocomplete;
}
