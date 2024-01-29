import { SqValuePath } from "@quri/squiggle-lang";

import { ItemStore, useViewerContext } from "../ViewerProvider.js";
import { keyboardEventHandler } from "./utils.js";

export const focusCell = (path: SqValuePath, itemStore: ItemStore) => {
  const handle = itemStore.handles[path.uid()];
  if (handle && handle.type === "cellItem") {
    handle.value.focus();
  }
};

type Adjustment = {
  row: (n: number) => number;
  column: (n: number) => number;
};

const movement: { [key: string]: Adjustment } = {
  left: {
    row: (n) => n,
    column: (n) => n - 1,
  },
  right: {
    row: (n) => n,
    column: (n) => n + 1,
  },
  down: {
    row: (n) => n + 1,
    column: (n) => n,
  },
  up: {
    row: (n) => n - 1,
    column: (n) => n,
  },
};

export function useTableCellKeyEvent(selected: SqValuePath) {
  const { setZoomedInPath, itemStore, findTableNode } = useViewerContext();

  const move = (adjustment: string) => {
    const newPath = findTableNode(selected)?.adjustCoords(movement[adjustment])
      ?.node.path;
    if (newPath) {
      focusCell(newPath, itemStore);
    }
  };

  return keyboardEventHandler({
    ArrowUp: () => move("up"),
    ArrowDown: () => move("down"),
    ArrowLeft: () => move("left"),
    ArrowRight: () => move("right"),
    Enter: () => {
      setZoomedInPath(selected);
    },
  });
}
