import { foldGutter } from "@codemirror/language";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  lineNumbers,
} from "@codemirror/view";

import { SqValuePath } from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";
import { useReactiveExtension } from "./codemirrorHooks.js";
import { getFocusGutterExtension } from "./getFocusGutterExtension.js";

export function useGutterExtension(
  view: EditorView | undefined,
  showGutter: boolean,
  {
    onFocusByPath,
    simulation,
  }: {
    onFocusByPath?: (path: SqValuePath) => void;
    simulation?: Simulation;
  }
) {
  return useReactiveExtension(
    view,
    () => {
      if (!view || !showGutter) return [];

      return [
        highlightActiveLine(),
        highlightActiveLineGutter(),
        onFocusByPath
          ? getFocusGutterExtension(view, simulation, onFocusByPath)
          : [],
        lineNumbers(),
        foldGutter(),
      ];
    },
    [showGutter, simulation, onFocusByPath]
  );
}
