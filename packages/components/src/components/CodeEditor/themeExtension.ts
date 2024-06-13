import { EditorView } from "@codemirror/view";

import { heightFacet } from "./fields.js";
import { extensionFromFacets } from "./utils.js";

export function themeExtension(initial: {
  height: number | string | undefined;
}) {
  return extensionFromFacets({
    facets: [heightFacet],
    initialValues: [initial.height ?? null],
    makeExtension: ([height]) =>
      EditorView.theme({
        "&": {
          ...(height === undefined ? {} : { height }),
        },
        ".cm-selectionMatch": { backgroundColor: "#33ae661a" },
        ".cm-content": { padding: 0 },
        ":-moz-focusring.cm-content": { outline: "none" },
      }),
  });
}
