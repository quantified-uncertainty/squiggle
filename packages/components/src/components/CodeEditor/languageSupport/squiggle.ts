import {
  foldInside,
  foldNodeProp,
  indentNodeProp,
  LanguageSupport,
  LRLanguage,
} from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";

import { SqProject } from "@quri/squiggle-lang";

import { makeCompletionSource } from "./autocomplete.js";
import { parser } from "./generated/squiggle.js";

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

      DecoratorName: t.variableName,
      "Decorator/*/String": t.comment,
      At: t.keyword,

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

export function squiggleLanguageSupport(project: SqProject) {
  return new LanguageSupport(
    LRLanguage.define({
      name: "squiggle",
      parser: parserWithMetadata,
      languageData: {
        commentTokens: {
          line: "//",
        },
        autocomplete: makeCompletionSource(project),
        closeBrackets: {
          brackets: ['"', "'", "(", "{"],
        },
      },
    }),
    []
  );
}
