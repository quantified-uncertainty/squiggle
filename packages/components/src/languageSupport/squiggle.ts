import {
  LRLanguage,
  LanguageSupport,
  indentNodeProp,
  foldNodeProp,
  foldInside,
  syntaxTree,
} from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
import { snippetCompletion, CompletionContext } from "@codemirror/autocomplete";
import { SqProject } from "@quri/squiggle-lang";
import { parser } from "./generated/squiggle.js";

export function squiggleLanguageSupport(project: SqProject) {
  return new LanguageSupport(
    LRLanguage.define({
      name: "squiggle",
      parser: parser.configure({
        props: [
          styleTags({
            if: t.keyword,
            then: t.keyword,
            else: t.keyword,

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

            FunctionName: t.function(t.variableName),

            LambdaSyntax: t.blockComment,

            VariableName: t.constant(t.variableName),
            Field: t.variableName,
            LambdaParameter: t.variableName,
          }),
          foldNodeProp.add({
            LambdaExpr: (context) => ({
              from: context.getChild("NonEmptyProgram")?.from || 0,
              to: context.getChild("NonEmptyProgram")?.to || 0,
            }),
            BlockExpr: foldInside,
            RecordExpr: foldInside,
            ArrayExpr: foldInside,
          }),
          indentNodeProp.add({
            RecordExpr: (context) =>
              context.baseIndent +
              (context.textAfter === "}" ? 0 : context.unit),
            BlockExpr: (context) =>
              context.baseIndent +
              (context.textAfter === "}" ? 0 : context.unit),
            LambdaExpr: (context) =>
              context.baseIndent +
              (context.textAfter === "}" ? 0 : context.unit),
            ArrayExpr: (context) =>
              context.baseIndent +
              (context.textAfter === "]" ? 0 : context.unit),
          }),
        ],
      }),
      languageData: {
        commentTokens: {
          line: "//",
        },
        autocomplete: (cmpl: CompletionContext) => {
          const tree = syntaxTree(cmpl.state);
          {
            const lambda = cmpl.tokenBefore(["ArgsOpen"]);
            if (lambda) {
              return {
                from: lambda.from,
                options: [
                  /*eslint no-template-curly-in-string: "off"*/
                  snippetCompletion("|${args}| ${body}", {
                    label: "|",
                    detail: "lambda function",
                    type: "syntax",
                  }),
                ],
              };
            }
          }
          const field = cmpl.tokenBefore(["AccessIdentifier"]);
          if (field === null) {
            return undefined;
          }
          const from = field.from;

          const cursor = tree.cursor();
          let names: String[] = [];
          while (cursor.next()) {
            if (cursor.type.is("VariableName")) {
              names.push(cmpl.state.doc.sliceString(cursor.from, cursor.to));
            }
          }
          return {
            from: from,
            options: [
              ...names.map((name) => ({
                label: name,
                type: "constant",
              })),
              ...project
                .getStdLib()
                .keySeq()
                .toArray()
                .map((name) => ({
                  label: name,
                  type: "function",
                })),
            ],
          };
        },
        closeBrackets: {
          brackets: ['"', "'", "(", "{"],
        },
      },
    }),
    []
  );
}
