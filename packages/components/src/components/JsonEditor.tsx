import React, { FC, useEffect, useMemo, useRef } from "react";

import {
  json as jsonLS,
  jsonParseLinter as jsonLint,
} from "@codemirror/lang-json";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { linter } from "@codemirror/lint";
import { basicSetup } from "codemirror";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  oneLine?: boolean;
  width?: number;
  height?: number;
}

const languageSupport = jsonLS();
const compTheme = new Compartment();
const compUpdateListener = new Compartment();

export const JsonEditor: FC<CodeEditorProps> = ({
  value,
  onChange,
  oneLine = false,
  width,
  height,
}) => {
  const editor = useRef<HTMLDivElement>(null);
  const editorView = useRef<EditorView | null>(null);

  const state = useMemo(
    () =>
      EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          compUpdateListener.of([]),
          languageSupport,
          linter(jsonLint()),
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
      effects: compUpdateListener.reconfigure(
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        })
      ),
    });
  }, [onChange]);

  return <div ref={editor}></div>;
};
