import { foldGutter } from "@codemirror/language";
import {
  highlightActiveLine,
  highlightActiveLineGutter,
  lineNumbers,
} from "@codemirror/view";

import { showGutterFacet } from "../fields.js";
import { extensionFromFacets } from "../utils.js";

export function gutterExtension(initialShowGutter: boolean) {
  return [
    extensionFromFacets({
      facets: [showGutterFacet],
      initialValues: [initialShowGutter],
      makeExtension: ([showGutter]) =>
        showGutter
          ? [
              highlightActiveLine(),
              highlightActiveLineGutter(),
              lineNumbers(),
              foldGutter(),
            ]
          : [],
    }),
  ];
}
