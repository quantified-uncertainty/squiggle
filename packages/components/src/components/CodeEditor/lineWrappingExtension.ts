import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { lineWrappingFacet } from "./fields.js";
import { extensionFromFacets } from "./utils.js";

export function lineWrappingExtension(initialLineWrapping: boolean): Extension {
  return [
    extensionFromFacets({
      facets: [lineWrappingFacet.facet],
      makeExtension: ([lineWrapping]) =>
        lineWrapping ? [EditorView.lineWrapping] : [],
      initialValues: [initialLineWrapping],
    }),
    lineWrappingFacet.extension,
  ];
}
