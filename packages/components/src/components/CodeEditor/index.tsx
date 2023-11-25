import { forwardRef, useCallback, useImperativeHandle } from "react";

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
    const view = useSquiggleEditorView(props);

    useImperativeHandle(ref, () => ({
      format: () => formatSquiggle(view),
      scrollTo: (position) => scrollToPosition(view, position),
    }));

    const setViewDom = useCallback(
      (element: HTMLDivElement | null) => {
        if (!view) return;
        // TODO: the editor breaks on hot reloading in storybook, investigate
        element?.replaceChildren(view.dom);
      },
      [view]
    );

    return <div style={{ fontSize: "13px" }} ref={setViewDom}></div>;
  }
);
