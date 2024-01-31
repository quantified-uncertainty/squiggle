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

class FocusableMarker extends GutterMarker {
  lineNumber: number;
  onClickLine: () => void;

  constructor(lineNumber: number, onClickLine: () => void) {
    super();
    this.lineNumber = lineNumber;
    this.onClickLine = onClickLine;
  }

  override toDOM() {
    // Create the outer div with the class 'px-1'
    const outerDiv = document.createElement("div");
    outerDiv.className = "pr-1 cursor-pointer focusable-marker"; // Tailwind padding class

    // Create the marker div
    const marker = document.createElement("div");
    marker.className = "focusable-marker-inner w-[2px] h-4 br-1 mt-[1px]";

    outerDiv.addEventListener("click", (e) => {
      e.preventDefault(); // Prevents default behavior
      e.stopPropagation(); // Stops the event from propagating further
      this.onClickLine(); // Call the onClickLine function
    });

    // Append the marker div to the outer div
    outerDiv.appendChild(marker);

    return outerDiv;
  }
}

export function useShowGutterExtension(
  view: EditorView | undefined,
  showGutter: boolean,
  onClickLine: (lineNumber: number) => void,
  activeLines: number[]
) {
  const markers = useMemo(() => {
    const builder = new RangeSetBuilder<GutterMarker>();
    if (view == null) return builder.finish();
    for (const i of activeLines.sort((a, b) => a - b)) {
      if (i >= 0 && i < view?.state.doc.lines) {
        const line = view.state.doc.line(i + 1);
        builder.add(
          line.from,
          line.to,
          new FocusableMarker(i + 1, () => onClickLine(i + 1))
        );
      }
    }
    return builder.finish();
  }, [activeLines, view, onClickLine]);

  return useReactiveExtension(
    view,
    () => {
      if (!view) return [];
      return showGutter
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
    [showGutter, activeLines]
  );
}
