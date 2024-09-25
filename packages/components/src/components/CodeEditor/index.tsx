import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { forwardRef, ReactNode, useImperativeHandle } from "react";

import { SqLocation, SqProject, SqValuePath } from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";
import { formatSquiggle } from "./formatSquiggleExtension.js";
import { useSquiggleEditorView } from "./useSquiggleEditorView.js";

const flashHighlight = StateEffect.define<{
  from: number;
  to: number;
} | null>();

const flashHighlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(highlights, tr) {
    highlights = highlights.map(tr.changes);
    for (let e of tr.effects) {
      if (e.is(flashHighlight)) {
        if (e.value) {
          highlights = highlights.update({
            add: [
              Decoration.mark({ class: "cm-flash-highlight" }).range(
                e.value.from,
                e.value.to
              ),
            ],
          });
        } else {
          highlights = Decoration.none;
        }
      }
    }
    return highlights;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export type CodeEditorProps = {
  defaultValue: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  // can be used as a hotkey (Cmd+Option+V, see `useViewNodeExtension`) or as an action for gutter markers
  onFocusByPath?: (path: SqValuePath) => void;
  height?: number | string;
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

    const scrollTo = (location: SqLocation, flash: boolean) => {
      if (!view) return;

      view.dispatch({
        scrollIntoView: true,
        effects: true
          ? flashHighlight.of({
              from: location.start.offset,
              to: location.end.offset,
            })
          : undefined,
      });
    };

    useImperativeHandle(ref, () => ({
      format: () => formatSquiggle(view),
      scrollTo,
      getSourceId: () => props.sourceId,
    }));

    return (
      <div style={{ fontSize: props.fontSize || "13px" }} ref={editorRef} />
    );
  }
);

const style = document.createElement("style");
style.textContent = `
  .cm-flash-highlight {
    background-color: #ff9999;
  }
`;
document.head.appendChild(style);
