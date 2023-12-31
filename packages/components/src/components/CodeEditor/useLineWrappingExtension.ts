import { EditorView } from "@codemirror/view";

import { useReactiveExtension } from "./codemirrorHooks.js";

export function useLineWrappingExtension(
  view: EditorView | undefined,
  lineWrapping: boolean
) {
  return useReactiveExtension(
    view,
    () => (lineWrapping ? [EditorView.lineWrapping] : []),
    [lineWrapping]
  );
}
