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
    svg.setAttribute("width", "12");
    svg.setAttribute("height", "12");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.classList.add("text-slate-200");
    svg.classList.add("opacity-50");
    svg.classList.add("mt-[3px]");
    svg.classList.add("mr-0.5");
    svg.classList.add("hover:text-green-700");
    svg.classList.add("hover:opacity-100");
    svg.classList.add("cursor-pointer");

    // Example path for a star shape, adjust as needed
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", "8"); // Center X of the circle
    circle.setAttribute("cy", "8"); // Center Y of the circle
    circle.setAttribute("r", "7"); // Radius of the circle
    circle.setAttribute("fill", "currentColor");

    svg.appendChild(circle);

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
  activeLines: number[],
  selectedLine: number | undefined
) {
  return useReactiveExtension(
    view,
    () =>
      showGutter
        ? [
            highlightActiveLine(),
            highlightActiveLineGutter(),
            gutter({
              markers: (view) => {
                // Explicitly create a RangeSetBuilder for GutterMarker
                const builder = new RangeSetBuilder<GutterMarker>();
                //Must be sorted, or errors happen.
                for (const i of activeLines.sort((a, b) => a - b)) {
                  if (i >= 0 && i < view.state.doc.lines) {
                    const line = view.state.doc.line(i + 1);
                    builder.add(
                      line.from,
                      line.to,
                      new StarMarker(i + 1, () => onClickLine(i + 1))
                    );
                  }
                }
                return builder.finish();
              },
              initialSpacer: () => new StarMarker(0, () => onClickLine(0)),
              updateSpacer: () => new StarMarker(0, () => onClickLine(0)),
            }),
            lineNumbers(),
            foldGutter(),
          ]
        : [],
    [showGutter, activeLines]
  );
}
