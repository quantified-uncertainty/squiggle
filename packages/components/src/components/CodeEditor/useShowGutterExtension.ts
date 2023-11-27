import { foldGutter } from "@codemirror/language";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  lineNumbers,
} from "@codemirror/view";

import { useReactiveExtension } from "./codemirrorHooks.js";

export function useShowGutterExtension(
  view: EditorView | undefined,
  showGutter: boolean
) {
  return useReactiveExtension(
    view,
    () =>
      showGutter
        ? [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            foldGutter(),
          ]
        : [],
    [showGutter]
  );
}
