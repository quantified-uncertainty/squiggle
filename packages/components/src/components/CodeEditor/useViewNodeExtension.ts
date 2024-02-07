import { EditorView, keymap } from "@codemirror/view";
import { useCallback } from "react";

import { SqProject, SqValuePath } from "@quri/squiggle-lang";

import { useReactiveExtension } from "./codemirrorHooks.js";

export function useViewNodeExtension(
  view: EditorView | undefined,
  {
    project,
    sourceId,
    onFocusByPath,
  }: {
    project: SqProject;
    sourceId: string;
    onFocusByPath?: (path: SqValuePath) => void;
  }
) {
  const viewCurrentPosition = useCallback(() => {
    if (!onFocusByPath || !view || !sourceId) {
      return;
    }
    const offset = view.state.selection.main.to;
    if (offset === undefined) {
      return;
    }
    const valuePathResult = project.findValuePathByOffset(sourceId, offset);
    if (valuePathResult.ok) {
      onFocusByPath(valuePathResult.value);
    }
  }, [onFocusByPath, project, sourceId, view]);

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
