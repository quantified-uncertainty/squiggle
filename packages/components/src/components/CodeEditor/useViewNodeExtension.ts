import { EditorView, keymap } from "@codemirror/view";
import { useCallback } from "react";

import { SqProject, SqValuePath } from "@quri/squiggle-lang";

import { useReactiveExtension } from "./codemirrorHooks.js";

export function useViewNodeExtension(
  view: EditorView | undefined,
  {
    project,
    sourceId,
    onFocusFromPath,
  }: {
    project: SqProject;
    sourceId: string;
    onFocusFromPath?: (path: SqValuePath) => void;
  }
) {
  const viewCurrentPosition = useCallback(() => {
    if (!onFocusFromPath || !view || !sourceId) {
      return;
    }
    const offset = view.state.selection.main.to;
    if (offset === undefined) {
      return;
    }
    const valuePathResult = project.findValuePathByOffset(sourceId, offset);
    if (valuePathResult.ok) {
      onFocusFromPath(valuePathResult.value);
    }
  }, [onFocusFromPath, project, sourceId, view]);

  return useReactiveExtension(
    view,
    () =>
      keymap.of([
        {
          key: "Alt-Shift-v",
          run: () => {
            viewCurrentPosition();
            return true;
          },
        },
      ]),
    [viewCurrentPosition]
  );
}
