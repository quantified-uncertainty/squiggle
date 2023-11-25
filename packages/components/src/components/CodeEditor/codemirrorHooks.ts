import {
  Compartment,
  EditorState,
  EditorStateConfig,
  Extension,
} from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { DependencyList, useCallback, useEffect, useState } from "react";

// This file includes generic helpers for using Codemirror with React.
// Squiggle-specific hooks are in `./useSquiggleEditorView.ts`.

// Create a compartment which gets reconfigured on props changes.
// See: https://codemirror.net/examples/config/#private-compartments
export function useReactiveExtension(
  view: EditorView | undefined,
  configure: () => Extension,
  // TODO: ESLint won't check these deps for us, is there some way to customize it?
  // ESLint supports `additionalHooks`, https://www.npmjs.com/package/eslint-plugin-react-hooks#advanced-configuration,
  // but it requires a different function signature: https://github.com/facebook/react/issues/25443
  deps: DependencyList
) {
  // `useState` is used here as an alternative to `useMemo` that doesn't complain about missing deps.
  const [{ compartment, extension }] = useState(() => {
    const compartment = new Compartment();
    const extension = compartment.of(configure());
    return { compartment, extension };
  });

  useEffect(() => {
    view?.dispatch({
      effects: compartment.reconfigure(configure()),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, ...deps]);
  return extension;
}

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
