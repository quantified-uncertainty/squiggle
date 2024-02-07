import { forwardRef, ReactNode, useImperativeHandle } from "react";

import { SqError, SqProject, SqValuePath } from "@quri/squiggle-lang";

import { formatSquiggle } from "./useFormatSquiggleExtension.js";
import { EditorGutterState } from "./useShowGutterExtension.js";
import { useSquiggleEditorView } from "./useSquiggleEditorView.js";

export type CodeEditorProps = {
  defaultValue: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onFocusByPath?: (path: SqValuePath) => void;
  width?: number;
  height?: number | string;
  lineWrapping?: boolean;
  errors?: SqError[];
  sourceId: string;
  fontSize?: number;
  gutter: EditorGutterState;
  project: SqProject;
  renderImportTooltip?: (params: {
    project: SqProject;
    importId: string;
  }) => ReactNode;
};

export type CodeEditorHandle = {
  format(): void;
  scrollTo(position: number, focus: boolean): void;
};

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(props, ref) {
    const { view, ref: editorRef } = useSquiggleEditorView(props);

    const scrollTo = (position: number, focus) => {
      if (!view) return;
      view.dispatch({
        selection: { anchor: position },
        scrollIntoView: true,
      });
      focus && view.focus();
    };

    useImperativeHandle(ref, () => ({
      format: () => formatSquiggle(view),
      scrollTo,
    }));

    return (
      <div style={{ fontSize: props.fontSize || "13px" }} ref={editorRef} />
    );
  }
);
