import { EditorView } from "@codemirror/view";

import { SqProject } from "@quri/squiggle-lang";

import { useReactiveExtension } from "./codemirrorHooks.js";
import { squiggleLanguageSupport } from "./languageSupport/squiggle.js";

export function useSquiggleLanguageExtension(
  view: EditorView | undefined,
  project: SqProject
) {
  return useReactiveExtension(view, () => squiggleLanguageSupport(project), [
    project,
  ]);
}
