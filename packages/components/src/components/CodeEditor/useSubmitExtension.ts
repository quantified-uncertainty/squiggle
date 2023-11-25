import { EditorView, keymap } from "@codemirror/view";
import { useReactiveExtension } from "./codemirrorHooks.js";

export function useSubmitExtension(
  view: EditorView | undefined,
  onSubmit: (() => void) | undefined
) {
  return useReactiveExtension(
    view,
    () =>
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            onSubmit?.();
            return true;
          },
        },
      ]),
    [onSubmit]
  );
}
