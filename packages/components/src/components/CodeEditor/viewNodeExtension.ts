import { keymap } from "@codemirror/view";

import { onFocusByPathFacet, projectFacet, sourceIdFacet } from "./fields.js";

export function viewNodeExtension() {
  return keymap.of([
    {
      key: "Alt-Shift-v",
      run: (view) => {
        const onFocusByPath = view.state.facet(onFocusByPathFacet);
        const sourceId = view.state.facet(sourceIdFacet);
        const project = view.state.facet(projectFacet);

        if (!onFocusByPath) {
          return true;
        }
        const offset = view.state.selection.main.to;
        if (offset === undefined) {
          return true;
        }
        const valuePathResult = project.findValuePathByOffset(sourceId, offset);
        if (valuePathResult.ok) {
          onFocusByPath(valuePathResult.value);
        }
        return true;
      },
    },
  ]);
}
