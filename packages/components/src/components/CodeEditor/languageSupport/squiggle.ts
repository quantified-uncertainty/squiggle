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
      "if then else import export as": t.keyword,

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
      LineComment: t.lineComment,
      BlockComment: t.blockComment,
      Escape: t.escape,

      DecoratorName: t.variableName,
      "Decorator/*/String": t.comment,
      At: t.keyword,

      VariableName: t.constant(t.variableName),
      Identifier: t.variableName,
      Field: t.variableName,
      LambdaParameterName: t.variableName,
    }),
    foldNodeProp.add({
      Lambda: (context) => ({
        from: context.getChild("NonEmptyProgram")?.from || 0,
        to: context.getChild("NonEmptyProgram")?.to || 0,
      }),
      Block: foldInside,
      Dict: foldInside,
      Array: foldInside,
    }),
    indentNodeProp.add({
      Dict: (context) =>
        context.baseIndent + (context.textAfter === "}" ? 0 : context.unit),
      Block: (context) =>
        context.baseIndent + (context.textAfter === "}" ? 0 : context.unit),
      Lambda: (context) =>
        context.baseIndent + (context.textAfter === "}" ? 0 : context.unit),
      Array: (context) =>
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
