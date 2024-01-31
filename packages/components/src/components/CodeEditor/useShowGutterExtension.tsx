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

export type EditorGutterState =
  | {
      type: "shown";
      activeLineNumbers: number[];
      onFocusFromEditorLine: (line: number) => void;
    }
  | { type: "hidden" };

class FocusableMarker extends GutterMarker {
  lineNumber: number;
  onClickLine: () => void;

  constructor(lineNumber: number, onClickLine: () => void) {
    super();
    this.lineNumber = lineNumber;
    this.onClickLine = onClickLine;
  }

  override toDOM() {
    const outerDiv = document.createElement("div");
    outerDiv.className = "pr-1 cursor-pointer focusable-marker";

    const marker = document.createElement("div");
    marker.className = "focusable-marker-inner w-[2px] h-4 br-1 mt-[1px]";

    outerDiv.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onClickLine();
    });

    outerDiv.appendChild(marker);

    return outerDiv;
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
          new FocusableMarker(i + 1, () =>
            gutterProps.onFocusFromEditorLine(i + 1)
          )
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
