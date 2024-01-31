import { SqValuePath } from "@quri/squiggle-lang";

import { toggleCollapsed, useViewerContext } from "../ViewerProvider.js";
import { keyboardEventHandler } from "./utils.js";

export function useZoomedOutSqValueKeyEvent(selected: SqValuePath) {
  const {
    setZoomedInPath: setZoomedInPath,
    itemStore,
    editor,
    findNode,
  } = useViewerContext();

  return keyboardEventHandler({
    ArrowDown: () => {
      const newPath = findNode(selected)?.next()?.node.path;
      newPath && itemStore.focusFromPath(newPath);
    },
    ArrowUp: () => {
      const newPath = findNode(selected)?.prev()?.node.path;
      newPath && itemStore.focusFromPath(newPath);
    },
    ArrowLeft: () => {
      const newItem = findNode(selected)?.parent();
      newItem &&
        !newItem.isRoot() &&
        itemStore.focusFromPath(newItem.node.path);
    },
    ArrowRight: () => {
      const newItem = findNode(selected)?.children().at(0);
      const isCollapsed = itemStore.state[selected.uid()]?.collapsed;

      if (newItem) {
        if (isCollapsed) {
          toggleCollapsed(itemStore, selected);
          setTimeout(() => {
            itemStore.focusFromPath(newItem.node.path);
          }, 1);
        } else {
          itemStore.focusFromPath(newItem.node.path);
        }
      }
    },
    Enter: () => {
      setZoomedInPath(selected);
    },
    " ": () => {
      toggleCollapsed(itemStore, selected);
    },
    //e for "edit." Focuses the line and focuses it.
    e: () => {
      const value = findNode(selected)?.value();
      const location = value?.context?.findLocation();

      if (location) {
        editor?.scrollTo(location.start.offset, true);
      }
    },
  });
}
