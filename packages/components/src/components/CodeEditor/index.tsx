import { forwardRef, useImperativeHandle } from "react";

import { SqError, SqProject, SqValuePath } from "@quri/squiggle-lang";

import {
  formatSquiggle,
  scrollToPosition,
  useSquiggleEditorView,
} from "./useSquiggleEditorView.js";

export type CodeEditorProps = {
  defaultValue: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onViewValuePath?: (path: SqValuePath) => void;
  width?: number;
  height?: number | string;
  showGutter?: boolean;
  lineWrapping?: boolean;
  errors?: SqError[];
  sourceId?: string;
  project: SqProject;
};

export type CodeEditorHandle = {
  format(): void;
  scrollTo(position: number): void;
};

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(props, ref) {
    const { view, ref: editorRef } = useSquiggleEditorView(props);

    useImperativeHandle(ref, () => ({
      format: () => formatSquiggle(view),
      scrollTo: (position) => scrollToPosition(view, position),
    }));

    return <div style={{ fontSize: "13px" }} ref={editorRef} />;
  }
);
