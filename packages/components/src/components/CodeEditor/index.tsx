import { forwardRef, ReactNode, useImperativeHandle } from "react";

import { SqLocation, SqProject, SqValuePath } from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";
import { applyExternalChange } from "./editorCommands.js";
import { formatSquiggle } from "./formatSquiggleExtension.js";
import {
  editorStateSnapshot,
  type EditorStateSnapshot,
  useSquiggleEditorView,
} from "./useSquiggleEditorView.js";

export type { EditorStateSnapshot } from "./useSquiggleEditorView.js";

export type CodeEditorProps = {
  defaultValue: string;
  // A state saved with `CodeEditorHandle.getState()` to start from (undo
  // history, selection, scroll). Read on mount only. If its code differs from
  // `defaultValue`, the difference is applied as an external change.
  initialState?: EditorStateSnapshot;
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
  focus(): void;
  // Takes code written by another program (e.g. a coding agent) in place:
  // one remote transaction outside the undo history, so the cursor,
  // selection, scroll, folds, focus and the user's undo history survive.
  applyExternalChange(code: string): void;
  // Doc, selection, undo history and scroll, for `initialState`.
  getState(): EditorStateSnapshot | undefined;
  // The main selection (offsets), e.g. to find the value at the cursor.
  getSelection(): { from: number; to: number } | undefined;
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
      focus: () => view?.focus(),
      applyExternalChange: (code) => {
        if (view) applyExternalChange(view, code);
      },
      getState: () => (view ? editorStateSnapshot(view) : undefined),
      getSelection: () => {
        if (!view) return undefined;
        const { from, to } = view.state.selection.main;
        return { from, to };
      },
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
