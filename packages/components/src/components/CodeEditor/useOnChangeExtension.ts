import { EditorView } from "@codemirror/view";
import { useReactiveExtension } from "./codemirrorHooks.js";

export function useOnChangeExtension(
  view: EditorView | undefined,
  onChange: (value: string) => void
) {
  return useReactiveExtension(
    view,
    () =>
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
    [onChange]
  );
}
