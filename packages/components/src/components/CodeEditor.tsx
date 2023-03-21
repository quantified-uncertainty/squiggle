import React, { FC, useEffect, useMemo, useRef } from "react";

import squiggle from "./languageSupport/squiggle";

import { SqLocation } from "@quri/squiggle-lang";

import { syntaxHighlighting } from "@codemirror/language";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { setDiagnostics } from "@codemirror/lint";

// From basic setup
import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
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
  bracketMatching,
  foldKeymap,
} from "@codemirror/language";
import { lightThemeHighlightingStyle } from "./languageSupport/highlightingStyle";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  oneLine?: boolean;
  width?: number;
  height?: number;
  showGutter?: boolean;
  errorLocations?: SqLocation[];
}

const compTheme = new Compartment();
const compGutter = new Compartment();
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
  const languageSupport = squiggle();
  const state = useMemo(
    () =>
      EditorState.create({
        doc: value,
        extensions: [
          highlightSpecialChars(),
          history(),
          drawSelection(),
          dropCursor(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          syntaxHighlighting(lightThemeHighlightingStyle, { fallback: true }),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          // rectangularSelection(),
          // crosshairCursor(),
          highlightSelectionMatches({
            wholeWords: true,
            highlightWordAroundCursor: true,
          }),
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
          compGutter.of([]),
          compUpdateListener.of([]),
          compSubmitListener.of([]),
          compTheme.of([]),
          languageSupport,
        ],
      }),
    []
  );

  useEffect(() => {
    if (editor.current != null && state != null) {
      const view = new EditorView({ state, parent: editor.current });
      editorView.current = view;

      return () => {
        view.destroy();
      };
    }
  }, [state]);

  useEffect(() => {
    editorView.current?.dispatch({
      effects: compGutter.reconfigure(
        showGutter
          ? [
              lineNumbers(),
              highlightActiveLine(),
              highlightActiveLineGutter(),
              foldGutter(),
            ]
          : []
      ),
    });
  }, [showGutter]);

  useEffect(() => {
    editorView.current?.dispatch({
      effects: compUpdateListener.reconfigure(
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
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
            ...(height !== null ? { height: `${height}px` } : {}),
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
    const docLength = editorView.current
      ? editorView.current.state.doc.length
      : 0;

    editorView.current?.dispatch(
      setDiagnostics(
        editorView.current.state,
        errorLocations
          .filter((f) => f.end.offset < docLength)
          .map((loc) => ({
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
