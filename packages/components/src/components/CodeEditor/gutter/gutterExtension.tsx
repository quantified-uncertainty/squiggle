import { foldGutter } from "@codemirror/language";
import { Compartment } from "@codemirror/state";
import {
  highlightActiveLine,
  highlightActiveLineGutter,
  lineNumbers,
} from "@codemirror/view";

import { showGutterFacet } from "../fields.js";
import { dispatchOnFacetsChange } from "../utils.js";
import { focusGutterExtension } from "./focusGutterExtension.js";

const gutterCompartment = new Compartment();

function getExtensions(showGutter: boolean) {
  return showGutter
    ? [
        highlightActiveLine(),
        highlightActiveLineGutter(),
        focusGutterExtension(),
        lineNumbers(),
        foldGutter(),
      ]
    : [];
}

export function gutterExtension(initialShowGutter: boolean) {
  return [
    dispatchOnFacetsChange(
      ([showGutter]) => ({
        effects: gutterCompartment.reconfigure(getExtensions(showGutter)),
      }),
      [showGutterFacet.facet]
    ),
    gutterCompartment.of(getExtensions(initialShowGutter)),
    showGutterFacet.extension,
  ];
}
