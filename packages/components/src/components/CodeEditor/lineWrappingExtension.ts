import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { lineWrappingFacet } from "./fields.js";
import { extensionFromFacets } from "./utils.js";

export function lineWrappingExtension(initialLineWrapping: boolean): Extension {
  return extensionFromFacets({
    facets: [lineWrappingFacet],
    makeExtension: ([lineWrapping]) =>
      lineWrapping ? [EditorView.lineWrapping] : [],
    initialValues: [initialLineWrapping],
  });
}
