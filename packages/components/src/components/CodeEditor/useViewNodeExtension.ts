import { EditorView, keymap } from "@codemirror/view";
import { useCallback } from "react";
import { SqProject, SqValuePath } from "@quri/squiggle-lang";
import { useReactiveExtension } from "./codemirrorHooks.js";

export function useViewNodeExtension(
  view: EditorView | undefined,
  {
    project,
    onViewValuePath,
    sourceId,
  }: {
    project: SqProject;
    onViewValuePath?: (path: SqValuePath) => void;
    sourceId?: string;
  }
) {
  const viewCurrentPosition = useCallback(() => {
    if (!onViewValuePath || !view || !sourceId) {
      return;
    }
    const offset = view.state.selection.main.to;
    if (offset === undefined) {
      return;
    }
    const valuePathResult = project.findValuePathByOffset(sourceId, offset);
    if (valuePathResult.ok) {
      onViewValuePath(valuePathResult.value);
    }
  }, [onViewValuePath, project, sourceId, view]);

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
