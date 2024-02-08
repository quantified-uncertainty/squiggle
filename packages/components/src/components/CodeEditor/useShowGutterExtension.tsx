import { foldGutter } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
  EditorView,
  gutter,
  GutterMarker,
  highlightActiveLine,
  highlightActiveLineGutter,
  lineNumbers,
} from "@codemirror/view";
import { useMemo } from "react";

import { useReactiveExtension } from "./codemirrorHooks.js";
import { reactAsDom } from "./utils.js";

export type EditorGutterState =
  | {
      type: "shown";
      activeLineNumbers: number[];
      onFocusByEditorLine: (line: number) => void;
    }
  | { type: "hidden" };

class FocusableMarker extends GutterMarker {
  onClickLine: () => void;

  constructor(onClickLine: () => void) {
    super();
    this.onClickLine = onClickLine;
  }

  override toDOM() {
    return reactAsDom(
      <div
        className="pr-1 pl-0.5 cursor-pointer group gutterMarker"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          this.onClickLine();
        }}
      >
        <div className="rounded-sm w-[3px] h-4 br-1 mt-[1px] bg-violet-50 group-hover:bg-violet-200 transition duration-75 gutterMarker-inner" />
      </div>
    ).dom;
  }
}

export function useShowGutterExtension(
  view: EditorView | undefined,
  gutterProps: EditorGutterState
) {
  const markers = useMemo(() => {
    if (gutterProps.type === "hidden") return [];
    const builder = new RangeSetBuilder<GutterMarker>();
    if (view == null) return builder.finish();
    for (const i of gutterProps.activeLineNumbers.sort((a, b) => a - b)) {
      if (i >= 0 && i < view?.state.doc.lines) {
        const line = view.state.doc.line(i + 1);
        builder.add(
          line.from,
          line.to,
          new FocusableMarker(() => gutterProps.onFocusByEditorLine(i + 1))
        );
      }
    }
    return builder.finish();
  }, [view, gutterProps]);

  return useReactiveExtension(
    view,
    () => {
      if (!view) return [];
      return gutterProps.type === "shown"
        ? [
            highlightActiveLine(),
            highlightActiveLineGutter(),
            gutter({
              class: "cm-lineNumberDot",
              markers: () => markers,
              initialSpacer: null,
              updateSpacer: (spacer, _) => spacer,
            }),
            lineNumbers(),
            foldGutter(),
          ]
        : [];
    },
    [gutterProps]
  );
}
