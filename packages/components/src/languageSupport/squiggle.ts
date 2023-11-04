import {
  Completion,
  CompletionSource,
  snippetCompletion,
} from "@codemirror/autocomplete";
import {
  LRLanguage,
  LanguageSupport,
  foldInside,
  foldNodeProp,
  indentNodeProp,
  syntaxTree,
} from "@codemirror/language";
import { SyntaxNode, Tree } from "@lezer/common";
import { styleTags, tags as t } from "@lezer/highlight";

import { SqProject } from "@quri/squiggle-lang";

import { parser } from "./generated/squiggle.js";

export function getNameNodes(tree: Tree, from: number) {
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

export function squiggleLanguageSupport(project: SqProject) {
  const parserWithMetadata = parser.configure({
    props: [
      styleTags({
        if: t.keyword,
        then: t.keyword,
        else: t.keyword,
        import: t.keyword,
        export: t.keyword,
        as: t.keyword,

        Equals: t.definitionOperator,

        ArithOp: t.arithmeticOperator,
        LogicOp: t.logicOperator,
        ControlOp: t.controlOperator,

        "{ }": t.brace,
        "[ ]": t.squareBracket,
        "( )": t.paren,
        "|": t.squareBracket,
        ",": t.separator,

        Syntax: t.annotation,
        Boolean: t.bool,
        Number: t.integer,
        String: t.string,
        Comment: t.comment,
        Void: t.escape,
        Escape: t.escape,

        FunctionName: t.function(t.variableName),

        LambdaSyntax: t.blockComment,

        VariableName: t.constant(t.variableName),
        IdentifierExpr: t.variableName,
        Field: t.variableName,
        LambdaParameterName: t.variableName,
      }),
      foldNodeProp.add({
        LambdaExpr: (context) => ({
          from: context.getChild("NonEmptyProgram")?.from || 0,
          to: context.getChild("NonEmptyProgram")?.to || 0,
        }),
        BlockExpr: foldInside,
        DictExpr: foldInside,
        ArrayExpr: foldInside,
      }),
      indentNodeProp.add({
        DictExpr: (context) =>
          context.baseIndent + (context.textAfter === "}" ? 0 : context.unit),
        BlockExpr: (context) =>
          context.baseIndent + (context.textAfter === "}" ? 0 : context.unit),
        LambdaExpr: (context) =>
          context.baseIndent + (context.textAfter === "}" ? 0 : context.unit),
        ArrayExpr: (context) =>
          context.baseIndent + (context.textAfter === "]" ? 0 : context.unit),
      }),
    ],
  });

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
    const localCompletions = nameNodes.map((node) => {
      const name = cmpl.state.doc.sliceString(node.from, node.to);
      const type = node.type.is("FunctionName") ? "function" : "variable";
      return {
        label: name,
        type,
      };
    }) satisfies Completion[];

    return {
      from,
      options: [
        ...localCompletions,
        ...(project
          .getStdLib()
          .keySeq()
          .toArray()
          .map((name) => ({
            label: name,
            type: "function",
          })) ?? []),
      ] satisfies Completion[],
    };
  };

  return new LanguageSupport(
    LRLanguage.define({
      name: "squiggle",
      parser: parserWithMetadata,
      languageData: {
        commentTokens: {
          line: "//",
        },
        autocomplete,
        closeBrackets: {
          brackets: ['"', "'", "(", "{"],
        },
      },
    }),
    []
  );
}
