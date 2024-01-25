import { SqValuePath } from "@quri/squiggle-lang";

import { useViewerContext } from "../ViewerProvider.js";
import { keyboardEventHandler } from "./utils.js";

export function useTableCellKeyEvent(selected: SqValuePath) {
  const { setFocused, itemStore, findTableNode } = useViewerContext();

  return keyboardEventHandler({
    ArrowUp: () => {
      const newPath = findTableNode(selected)?.up()?.node.path;
      if (newPath) {
        setFocused(newPath);
      }
    },
  });
}
