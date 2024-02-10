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
import { clsx } from "clsx";

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
        className="pr-1 pl-0.5 cursor-pointer group/marker"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          this.onClickLine();
        }}
      >
        <div
          className={clsx(
            // initial color, specialized for active lines
            "bg-violet-50 [.cm-activeLineGutter_&]:bg-white",
            // highlight all markers on gutter hover; highlight the hovered markers even more
            "group-hover/gutter:bg-violet-200 group-hover/marker:!bg-violet-400",
            "rounded-sm w-[3px] h-4 br-1 mt-[1px]",
            "transition duration-75"
          )}
        />
      </div>
    ).dom;
  }
}

export function useShowGutterExtension(
  view: EditorView | undefined,
  gutterProps: EditorGutterState
) {
  return useReactiveExtension(
    view,
    () => {
      if (!view || gutterProps.type === "hidden") return [];

      const builder = new RangeSetBuilder<GutterMarker>();
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
      const markers = builder.finish();

      return [
        highlightActiveLine(),
        highlightActiveLineGutter(),
        gutter({
          class: "min-w-[9px] group/gutter",
          markers: () => markers,
        }),
        lineNumbers(),
        foldGutter(),
      ];
    },
    [gutterProps]
  );
}
