import { forwardRef, ReactNode, useImperativeHandle } from "react";

import { SqError, SqProject, SqValuePath } from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";
import { formatSquiggle } from "./useFormatSquiggleExtension.js";
import { useSquiggleEditorView } from "./useSquiggleEditorView.js";

export type CodeEditorProps = {
  defaultValue: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  // can be used as a hotkey (Cmd+Option+V, see `useViewNodeExtension`) or as an action for gutter markers
  onFocusByPath?: (path: SqValuePath) => void;
  width?: number;
  height?: number | string;
  lineWrapping?: boolean;
  errors?: SqError[];
  sourceId: string;
  fontSize?: number;
  showGutter?: boolean;
  project: SqProject;
  // useful when we want to render values that were computed by some external component (e.g. the playground)
  simulation?: Simulation;
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
