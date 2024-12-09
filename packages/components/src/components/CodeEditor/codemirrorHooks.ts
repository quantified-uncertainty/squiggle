import { EditorState, EditorStateConfig } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useCallback, useEffect, useState } from "react";

// This file includes generic helpers for using Codemirror with React.

export function useCodemirrorView() {
  return useState<EditorView>();
}

export function useConfigureCodemirrorView(
  // TODO: we need both view and setView from previously called `useState`, is there any way to simplify this?
  // Check `useSquiggleEditorView` hook to see how this is used.
  view: EditorView | undefined,
  setView: (view: EditorView) => void,
  config: EditorStateConfig
) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return; // no SSR
    }

    const state = EditorState.create(config);
    setView(new EditorView({ state }));
    return () => {
      view?.destroy();
    };
    // we initialize the view only once; no need for deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setViewDom = useCallback(
    (element: HTMLDivElement | null) => {
      if (!view) return;
      // TODO: the editor breaks on hot reloading in storybook, investigate
      element?.replaceChildren(view.dom);
    },
    [view]
  );

  return setViewDom;
}
