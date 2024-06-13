import { keymap } from "@codemirror/view";

import { onSubmitFacet } from "./fields.js";

export function onSubmitExtension() {
  return keymap.of([
    {
      key: "Mod-Enter",
      run: (view) => {
        view.state.facet(onSubmitFacet)?.();
        return true;
      },
    },
  ]);
}
