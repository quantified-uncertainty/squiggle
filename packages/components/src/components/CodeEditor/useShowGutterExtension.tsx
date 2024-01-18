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

// Define a custom GutterMarker class
class StarMarker extends GutterMarker {
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

    return svg;
  }
}

function makeMarker() {
  return new StarMarker();
}

export function useShowGutterExtension(
  view: EditorView | undefined,
  showGutter: boolean
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
                // for (let i = 0; i < view.state.doc.lines; i++) {
                for (let i = 0; i < 1099; i++) {
                  builder.add(i, i + 1, makeMarker());
                }
                return builder.finish();
              },
              initialSpacer: () => new StarMarker(),
              updateSpacer: () => new StarMarker(),
            }),
          ]
        : [],
    [showGutter]
  );
}
