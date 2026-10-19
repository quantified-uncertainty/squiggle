import { EditorState, EditorStateConfig } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useCallback, useEffect, useRef, useState } from "react";

// This file includes generic helpers for using Codemirror with React.

export function useCodemirrorView() {
  return useState<EditorView>();
}

export function useConfigureCodemirrorView(
  // TODO: we need both view and setView from previously called `useState`, is there any way to simplify this?
  // Check `useSquiggleEditorView` hook to see how this is used.
  view: EditorView | undefined,
  setView: (view: EditorView) => void,
  config: EditorStateConfig,
  options: {
    // Builds the initial state instead of `EditorState.create(config)`, e.g.
    // to restore a saved one.
    createState?: (config: EditorStateConfig) => EditorState;
    // Called once the view's DOM is in the document (e.g. to restore scroll).
    onAttach?: (view: EditorView) => void;
  } = {}
) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (typeof window === "undefined") {
      return; // no SSR
    }

    const create = optionsRef.current.createState;
    const state = create ? create(config) : EditorState.create(config);
    const newView = new EditorView({ state });
    setView(newView);
    return () => {
      newView.destroy();
    };
    // we initialize the view only once; no need for deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attachedRef = useRef<EditorView | undefined>(undefined);
  const setViewDom = useCallback(
    (element: HTMLDivElement | null) => {
      if (!view) return;
      // TODO: the editor breaks on hot reloading in storybook, investigate
      element?.replaceChildren(view.dom);
      if (element && attachedRef.current !== view) {
        attachedRef.current = view;
        optionsRef.current.onAttach?.(view);
      }
    },
    [view]
  );

  return setViewDom;
}
