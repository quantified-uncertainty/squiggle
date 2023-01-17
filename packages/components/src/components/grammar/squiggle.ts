import { LRLanguage, LanguageSupport } from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
import { snippetCompletion } from "@codemirror/autocomplete";
import { parser } from "./generated/squiggle";

const squiggleLang = LRLanguage.define({
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

        FunctionName: t.function(t.propertyName),

        LambdaSyntax: t.blockComment,

        VariableName: t.variableName,
        Field: t.variableName,
        LambdaParameter: t.variableName,
      }),
    ],
  }),
  languageData: {
    commentTokens: {
      line: "#",
    },
    autocomplete: [
      snippetCompletion("{ |${args}| ${body} ", {
        label: "{",
        detail: "lambda function",
      }),
    ],
    closeBrackets: {
      brackets: ['"', "'", "(", "{", "|"],
    },
  },
});

function squiggle() {
  return new LanguageSupport(squiggleLang, []);
}

export default squiggle
