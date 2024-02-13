import { foldGutter } from "@codemirror/language";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  lineNumbers,
} from "@codemirror/view";

import { useReactiveExtension } from "./codemirrorHooks.js";
import { focusGutterExtension } from "./focusGutterExtension.js";

export function useGutterExtension(
  view: EditorView | undefined,
  showGutter: boolean
) {
  return useReactiveExtension(
    view,
    () => {
      if (!view || !showGutter) return [];

      return [
        highlightActiveLine(),
        highlightActiveLineGutter(),
        focusGutterExtension(),
        lineNumbers(),
        foldGutter(),
      ];
    },
    [showGutter]
  );
}
