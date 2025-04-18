import { forwardRef, ReactNode, useImperativeHandle } from "react";

import { SqLocation, SqProject, SqValuePath } from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";
import { formatSquiggle } from "./formatSquiggleExtension.js";
import { useSquiggleEditorView } from "./useSquiggleEditorView.js";

export type CodeEditorProps = {
  defaultValue: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  // can be used as a hotkey (Cmd+Option+V, see `useViewNodeExtension`) or as an action for gutter markers
  onFocusByPath?: (path: SqValuePath) => void;
  height?: number | "100%";
  lineWrapping?: boolean;
  sourceId: string; // TODO - remove this, it's not very useful since source ids in the new SqProject are not unique
  fontSize?: number;
  showGutter?: boolean;
  project: SqProject;
  // `simulation` is useful when we want to render values that were computed by some external component (e.g. the playground).
  // Note that this can come from some previous version of the code; code execution is async.
  simulation?: Simulation;
  renderImportTooltip?: (params: {
    project: SqProject;
    importId: string;
  }) => ReactNode;
};

export type CodeEditorHandle = {
  format(): void;
  scrollTo(location: SqLocation, focus: boolean): void;
  getSourceId(): string;
};

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(props, ref) {
    const { view, ref: editorRef } = useSquiggleEditorView(props);

    const scrollTo = (location: SqLocation, focus: boolean) => {
      if (!view) return;
      view.dispatch({
        selection: { anchor: location.start.offset, head: location.end.offset },
        scrollIntoView: true,
      });
      if (focus) {
        view.focus();
      }
    };

    useImperativeHandle(ref, () => ({
      format: () => formatSquiggle(view),
      scrollTo,
      getSourceId: () => props.sourceId,
    }));

    return (
      <div
        style={{ fontSize: props.fontSize || "13px" }}
        className={props.height === "100%" ? "h-full max-h-full" : ""}
        ref={editorRef}
      />
    );
  }
);
