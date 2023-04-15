import React, { FC, useEffect, useMemo, useRef } from "react";

import { SqLocation, SqProject } from "@quri/squiggle-lang";
import { syntaxHighlighting } from "@codemirror/language";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { setDiagnostics } from "@codemirror/lint";

import { squiggleLanguageSupport } from "../languageSupport/squiggle.js";

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
import { lightThemeHighlightingStyle } from "../languageSupport/highlightingStyle.js";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  width?: number;
  height?: number;
  showGutter?: boolean;
  errorLocations?: SqLocation[];
  project: SqProject;
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
  showGutter = false,
  errorLocations = [],
  project,
}) => {
  const editor = useRef<HTMLDivElement>(null);
  const editorView = useRef<EditorView | null>(null);
  const languageSupport = useMemo(
    () => squiggleLanguageSupport(project),
    [project]
  );

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
            highlightWordAroundCursor: false, // Works weird on fractions! 5.3e10K
          }),
          compSubmitListener.of([]),
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
          compTheme.of([]),
          languageSupport,
        ],
      }),
    [languageSupport]
  );

  useEffect(() => {
    if (editor.current) {
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
            ...(width === undefined ? {} : { width: `${width}px` }),
            ...(height === undefined ? {} : { height: `${height}px` }),
          },
          ".cm-selectionMatch": { backgroundColor: "#33ae661a" },
          ".cm-content": { padding: 0 },
          ":-moz-focusring.cm-content": { outline: "none" },
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
                  key: "Mod-Enter",
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

  return (
    <div
      style={{ minWidth: `${width}px`, minHeight: `${height}px` }}
      ref={editor}
    ></div>
  );
};
