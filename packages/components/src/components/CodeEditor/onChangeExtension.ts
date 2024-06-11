import { EditorView } from "@codemirror/view";

import { onChangeFacet } from "./fields.js";

export function onChangeExtension() {
  return EditorView.updateListener.of((update) => {
    if (!update.docChanged) {
      return;
    }
    const onChange = update.state.facet(onChangeFacet);
    onChange(update.state.doc.toString());
  });
}
