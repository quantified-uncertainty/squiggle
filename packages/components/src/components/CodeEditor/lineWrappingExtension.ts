import { Compartment, Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { lineWrappingFacet } from "./fields.js";
import { dispatchOnFacetsChange } from "./utils.js";

const compartment = new Compartment();

function getExtensions(lineWrapping: boolean): Extension {
  return lineWrapping ? [EditorView.lineWrapping] : [];
}

export function lineWrappingExtension(initialLineWrapping: boolean): Extension {
  return [
    dispatchOnFacetsChange(
      ([lineWrapping]) => ({
        effects: compartment.reconfigure(getExtensions(lineWrapping)),
      }),
      [lineWrappingFacet.facet]
    ),
    compartment.of(getExtensions(initialLineWrapping)),
    lineWrappingFacet.extension,
  ];
}
