import _ from "lodash";
import React, { FC, useEffect, useMemo, useRef } from "react";

import { parser } from "./grammar/squiggle";


import { basicSetup } from "codemirror";
import { LRLanguage, LanguageSupport, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { completeAnyWord, snippetCompletion } from "@codemirror/autocomplete";
import { styleTags, tags as t, Tag } from "@lezer/highlight";

import { SqLocation } from "@quri/squiggle-lang";
import { oneDark } from "@codemirror/theme-one-dark";
import { printTree } from "./grammar/lezer-debug";


const sqLang = LRLanguage.define({
  name: "squiggle",
  parser: parser.configure({
    props: [
      styleTags({
        "if": t.keyword,
        "then": t.keyword,
        "else": t.keyword,
        
        "Equals": t.definitionOperator,

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

  useEffect(() => {
    if (editor.current != null) {
      const theme = EditorView.theme({
        "&": {
          height: `${height}px`,
        },
        ".cm-line span": {
          position: "relative",
        },
        ".cm-line span:hover::after": {
          position: "absolute",
          bottom: "100%",
          left: 0,
          background: "black",
          color: "white",
          border: "solid 2px",
          borderRadius: "5px",
          content: "var(--tags)",
          width: `max-content`,
          padding: "1px 4px",
          zIndex: 10,
          pointerEvents: "none",
        }
      }, {dark: true});

      const updateListener = EditorView.updateListener.of((update) => {
        // console.log(printTree(squiggle().language.parser.parse(update.state.doc.toString()), update.state.doc.toString(), { }))
        onChange(update.state.doc.toString());
      });

      const state = EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          updateListener,
          keymap.of(defaultKeymap),
          theme,
          oneDark,
          squiggle(),
          sqLang.data.of({ autocomplete: [
            snippetCompletion("{ |${args}| ${body} }", {label: "lambda"}),
          ] }),
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
