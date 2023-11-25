import {
  Compartment,
  EditorState,
  EditorStateConfig,
  Extension,
} from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { DependencyList, useEffect, useState } from "react";

export function useReactiveExtension(
  view: EditorView | undefined,
  configure: () => Extension,
  deps: DependencyList
) {
  // useState is used here as an alternative to useMemo that doesn't complain about missing deps.
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
  [view, setView]: ReturnType<typeof useCodemirrorView>,
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
}
