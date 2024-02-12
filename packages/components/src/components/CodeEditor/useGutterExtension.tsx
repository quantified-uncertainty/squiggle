import { foldGutter } from "@codemirror/language";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  lineNumbers,
} from "@codemirror/view";

import { SqValuePath } from "@quri/squiggle-lang";

import { useReactiveExtension } from "./codemirrorHooks.js";
import { getFocusGutterExtension } from "./getFocusGutterExtension.js";

export function useGutterExtension(
  view: EditorView | undefined,
  showGutter: boolean,
  {
    onFocusByPath,
  }: {
    onFocusByPath?: (path: SqValuePath) => void;
  }
) {
  return useReactiveExtension(
    view,
    () => {
      if (!view || !showGutter) return [];

      return [
        highlightActiveLine(),
        highlightActiveLineGutter(),
        onFocusByPath ? getFocusGutterExtension(view, onFocusByPath) : [],
        lineNumbers(),
        foldGutter(),
      ];
    },
    [showGutter, onFocusByPath]
  );
}
