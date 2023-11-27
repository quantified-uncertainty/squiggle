import { EditorView } from "@codemirror/view";
import { useReactiveExtension } from "./codemirrorHooks.js";

export function useWidthHeightExtension(
  view: EditorView | undefined,
  {
    width,
    height,
  }: { width: number | undefined; height: string | number | undefined }
) {
  return useReactiveExtension(
    view,
    () =>
      EditorView.theme({
        "&": {
          ...(width === undefined ? {} : { width }),
          ...(height === undefined ? {} : { height }),
        },
        ".cm-selectionMatch": { backgroundColor: "#33ae661a" },
        ".cm-content": { padding: 0 },
        ":-moz-focusring.cm-content": { outline: "none" },
      }),
    [width, height]
  );
}
