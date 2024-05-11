import { SqValuePath } from "@quri/squiggle-lang";

import { toggleCollapsed, useViewerContext } from "../ViewerProvider.js";
import { keyboardEventHandler } from "./utils.js";

export function useZoomedOutSqValueKeyEvent(selected: SqValuePath) {
  const {
    setZoomedInPath: setZoomedInPath,
    itemStore,
    externalActions,
    findNode,
  } = useViewerContext();

  return keyboardEventHandler({
    ArrowDown: () => {
      const newPath = findNode(selected)?.next()?.node.path;
      newPath && itemStore.focusByPath(newPath);
    },
    ArrowUp: () => {
      const newPath = findNode(selected)?.prev()?.node.path;
      newPath && itemStore.focusByPath(newPath);
    },
    ArrowLeft: () => {
      const newItem = findNode(selected)?.parent();
      newItem && !newItem.isRoot() && itemStore.focusByPath(newItem.node.path);
    },
    ArrowRight: () => {
      const newItem = findNode(selected)?.children().at(0);
      const isCollapsed = itemStore.state[selected.uid()]?.collapsed;

      if (newItem) {
        if (isCollapsed) {
          toggleCollapsed(itemStore, selected);
          setTimeout(() => {
            itemStore.focusByPath(newItem.node.path);
          }, 1);
        } else {
          itemStore.focusByPath(newItem.node.path);
        }
      }
    },
    Enter: () => {
      setZoomedInPath(selected);
      itemStore.focusByPath(selected);
    },
    " ": () => {
      toggleCollapsed(itemStore, selected);
    },
    //e for "edit." Focuses the line and focuses it.
    e: () => {
      const value = findNode(selected)?.value();
      const location = value?.context?.findLocation();

      if (location) {
        externalActions?.show?.(location.start.offset, true);
      }
    },
  });
}
