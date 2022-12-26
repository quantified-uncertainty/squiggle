import _ from "lodash";
import React, { FC, useEffect, useMemo, useRef } from "react";

import { parser } from "./grammar/squiggle";

import { basicSetup } from "codemirror";
import {
  LRLanguage,
  LanguageSupport,
  HighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { snippetCompletion } from "@codemirror/autocomplete";
import { linter } from "@codemirror/lint";
import { styleTags, tags as t } from "@lezer/highlight";

import { SqLocation } from "@quri/squiggle-lang";
import { oneDark } from "@codemirror/theme-one-dark";
import { printTree } from "./grammar/lezer-debug";

// From basic setup
import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
} from "@codemirror/view";
import { history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  closeBrackets,
  autocompletion,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import {
  foldGutter,
  indentOnInput,
  defaultHighlightStyle,
  bracketMatching,
  foldKeymap,
} from "@codemirror/language";

const sqLang = LRLanguage.define({
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
  return new LanguageSupport(sqLang, []);
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  oneLine?: boolean;
  width?: number;
  height: number;
  showGutter?: boolean;
  errorLocations?: SqLocation[];
}

export const CodeEditor: FC<CodeEditorProps> = ({
  value,
  onChange,
  onSubmit,
  height,
  oneLine = false,
  showGutter = false,
  errorLocations = [],
}) => {
  const id = useMemo(() => _.uniqueId(), []);
  const editor = useRef<HTMLDivElement>(null);

  if (editor.current != null) {
    
  }

  useEffect(() => {
    if (editor.current != null) {
      const theme = EditorView.theme({
        "&": {
          height: `${height}px`,
        },
      });

      // Needs propagating the state upwards
      // const lint = linter(() =>
      //   errorLocations.map((loc) => ({
      //     from: loc.start.offset,
      //     to: loc.end.offset,
      //     severity: "error",
      //     message: "Syntax error!",
      //   }))
      // );

      const updateListener = EditorView.updateListener.of((update) => {
        console.log(
          printTree(
            squiggle().language.parser.parse(update.state.doc.toString()),
            update.state.doc.toString(),
            {}
          )
        );
        onChange(update.state.doc.toString());
      });

      const submitListener = keymap.of(
        onSubmit
          ? [
              {
                key: "Ctrl-s",
                run: () => {
                  onSubmit();
                  return true;
                },
              },
            ]
          : []
      );
      const state = EditorState.create({
        doc: value,
        extensions: [
          ((showGutter) ? [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            foldGutter(),  
          ] : []),
          
          highlightSpecialChars(),
          history(),
          drawSelection(),
          dropCursor(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          // rectangularSelection(),
          // crosshairCursor(),
          highlightSelectionMatches(),

          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...lintKeymap,
            indentWithTab,
          ]),

          updateListener,
          submitListener,
          theme,
          squiggle(),
        ],
      });
      const view = new EditorView({ state, parent: editor.current });

      return () => {
        view.destroy();
      };
    }
  }, []);

  return <div id={id} onSubmit={onSubmit} ref={editor}></div>;
};
