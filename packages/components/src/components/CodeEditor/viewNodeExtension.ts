import { keymap } from "@codemirror/view";

import { onFocusByPathFacet, simulationFacet } from "./fields.js";

export function viewNodeExtension() {
  return keymap.of([
    {
      key: "Alt-Shift-v",
      run: (view) => {
        const onFocusByPath = view.state.facet(onFocusByPathFacet);
        const simulation = view.state.facet(simulationFacet);

        if (!onFocusByPath) {
          return true;
        }
        const offset = view.state.selection.main.to;
        if (offset === undefined) {
          return true;
        }
        const valuePathResult =
          simulation?.output?.findValuePathByOffset(offset);
        if (valuePathResult?.ok) {
          onFocusByPath(valuePathResult.value);
        }
        return true;
      },
    },
  ]);
}
