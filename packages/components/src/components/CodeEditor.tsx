import _ from "lodash";
import React, { FC, useEffect, useMemo, useRef } from "react";

import { LRLanguage, LanguageSupport } from "@codemirror/language";
import { parser } from "./grammar/squiggle";

import { basicSetup } from "codemirror";

import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { completeAnyWord } from "@codemirror/autocomplete";
import { styleTags, tags as t } from "@lezer/highlight";

import { SqLocation } from "@quri/squiggle-lang";
import { parseArgs } from "util";
import CodeMirror, { useCodeMirror } from "@uiw/react-codemirror";

const sqLang = LRLanguage.define({
  name: "squiggle",
  parser: parser.configure({
    props: [
      styleTags({
        "if": t.keyword,
        "then": t.keyword,
        "else": t.keyword,
        
        "=": t.definitionOperator,
        
        "arith": t.arithmeticOperator,
        "|": t.bitwiseOperator,
        
        "||": t.bitwiseOperator,
        "&&": t.bitwiseOperator,

        "|>": t.controlOperator,
        
        ArithOp: t.arithmeticOperator,
        BinOp: t.logicOperator,
        FunOp: t.controlOperator,
        
        Syntax: t.annotation,
        Boolean: t.bool,
        Number: t.integer,
        String: t.string,
        Comment: t.comment,
        Void: t.atom,
        Identifier: t.variableName,
        Assignment: t.definitionOperator,
        VariableName: t.variableName,
        FunctionName: t.bool,
        LambdaExpr: t.definitionKeyword
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
      });

      const updateListener = EditorView.updateListener.of((update) => {
        onChange(update.state.doc.toString());
      });

      const state = EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          updateListener,
          keymap.of(defaultKeymap),
          theme,
          sqLang.data.of({ autocomplete: completeAnyWord }),
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
