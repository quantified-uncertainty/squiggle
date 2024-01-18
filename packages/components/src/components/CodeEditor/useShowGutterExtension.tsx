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

import { useReactiveExtension } from "./codemirrorHooks.js";

class StarMarker extends GutterMarker {
  lineNumber: number;
  onClickLine: () => void;

  constructor(lineNumber: number, onClickLine: () => void) {
    super();
    this.lineNumber = lineNumber;
    this.onClickLine = onClickLine;
  }

  override toDOM() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "10");
    svg.setAttribute("height", "10");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.classList.add("text-green-600");
    svg.classList.add("opacity-40");
    svg.classList.add("mt-[3px]");
    svg.classList.add("hover:text-green-700");
    svg.classList.add("hover:opacity-100");
    svg.classList.add("cursor-pointer");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // Example path for a star shape, adjust as needed
    path.setAttribute("d", "M 2 2 L 14 8 L 2 14 Z");

    path.setAttribute("fill", "currentColor");

    svg.appendChild(path);

    svg.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onClickLine();
    });

    return svg;
  }
}

export function useShowGutterExtension(
  view: EditorView | undefined,
  showGutter: boolean,
  onClickLine: (lineNumber: number) => void,
  activeLines: number[]
) {
  return useReactiveExtension(
    view,
    () =>
      showGutter
        ? [
            highlightActiveLine(),
            highlightActiveLineGutter(),
            foldGutter(),
            lineNumbers(),
            gutter({
              class: "cm-customGutter",
              markers: (view) => {
                // Explicitly create a RangeSetBuilder for GutterMarker
                const builder = new RangeSetBuilder<GutterMarker>();
                for (let i = 0; i < 10; i++) {
                  // for (const i of activeLines) {
                  const line = view.state.doc.line(i + 1);
                  builder.add(
                    line.from,
                    line.to,
                    new StarMarker(i + 1, () => onClickLine(i))
                  );
                }
                return builder.finish();
              },
              initialSpacer: () => new StarMarker(0, () => onClickLine(0)),
              updateSpacer: () => new StarMarker(0, () => onClickLine(0)),
            }),
          ]
        : [],
    [showGutter]
  );
}
