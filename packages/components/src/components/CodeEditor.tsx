import _ from "lodash";
import React, { FC, useEffect, useMemo, useRef, useReducer } from "react";

import { parser } from "./grammar/squiggle";

import { basicSetup } from "codemirror";
import {
  LRLanguage,
  LanguageSupport,
  HighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  EditorState,
  Facet,
  TransactionSpec,
  Compartment,
} from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { snippetCompletion } from "@codemirror/autocomplete";
import { linter, Diagnostic, setDiagnostics } from "@codemirror/lint";
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

const compTheme = new Compartment();
const compLang = new Compartment();
const compUpdateListener = new Compartment();
const compSubmitListener = new Compartment();

export const CodeEditor: FC<CodeEditorProps> = ({
  value,
  onChange,
  onSubmit,
  width,
  height,
  oneLine = false,
  showGutter = false,
  errorLocations = [],
}) => {
  const editor = useRef<HTMLDivElement>(null);
  const editorView = useRef<EditorView | null>(null);
  const state = useMemo(
    () =>
      EditorState.create({
        doc: value,
        extensions: [
          showGutter
            ? [
                lineNumbers(),
                highlightActiveLine(),
                highlightActiveLineGutter(),
                foldGutter(),
              ]
            : [],
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
          compUpdateListener.of([]),
          compSubmitListener.of([]),
          compTheme.of([]),
          compLang.of(squiggle()),
        ],
      }),
    []
  );

  useEffect(() => {
    if (editor.current != null && state != null) {
      // Needs propagating the state upwards
      console.log("recreate view");
      const view = new EditorView({ state, parent: editor.current });
      editorView.current = view;

      return () => {
        view.destroy();
      };
    }
  }, []);

  useEffect(() => {
    editorView.current?.dispatch({
      effects: compUpdateListener.reconfigure(
        EditorView.updateListener.of((update) => {
          console.log(
            printTree(
              squiggle().language.parser.parse(update.state.doc.toString()),
              update.state.doc.toString(),
              {}
            )
          );
          onChange(update.state.doc.toString());
        })
      ),
    });
  }, [onChange]);
  
  useEffect(() => {
    editorView.current?.dispatch({
      effects: compTheme.reconfigure(
        EditorView.theme({
          "&": {
            ...(width !== null ? { width: `${width}px` } : {}),
            height: `${height}px`,
          },
        })
      ),
    });
  }, [width, height]);

  useEffect(() => {
    editorView.current?.dispatch({
      effects: compSubmitListener.reconfigure(
        keymap.of(
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
        )
      ),
    });
  }, [onSubmit]);

  useEffect(() => {
    editorView.current?.dispatch(
      setDiagnostics(
        editorView.current.state,
        errorLocations.map((loc) => ({
          from: loc.start.offset,
          to: loc.end.offset,
          severity: "error",
          message: "Syntax error!",
        }))
      )
    );
  }, [errorLocations]);

  return <div ref={editor}></div>;
};
