import { SqValuePath } from "@quri/squiggle-lang";

import { useViewerContext } from "../ViewerProvider.js";
import { keyboardEventHandler } from "./utils.js";

export function useZoomedInSqValueKeyEvent(selected: SqValuePath) {
  const {
    setZoomedInPath: setZoomedInPath,
    itemStore,
    findNode,
  } = useViewerContext();

  function resetToRoot() {
    setZoomedInPath(undefined);

    // This timeout is a hack to make sure the header is zoomedIn after the reset
    setTimeout(() => {
      itemStore.focusByPath(selected);
    }, 1);
  }

  return keyboardEventHandler({
    ArrowDown: () => {
      const newPath = findNode(selected)?.nextSibling()?.node.path;
      if (newPath) {
        setZoomedInPath(newPath);
        itemStore.focusByPath(newPath);
      }
    },
    ArrowUp: () => {
      const newPath = findNode(selected)?.prevSibling()?.node.path;
      if (newPath) {
        setZoomedInPath(newPath);
        itemStore.focusByPath(newPath);
      }
    },
    ArrowLeft: () => {
      const newItem = findNode(selected)?.parent();
      if (newItem) {
        if (newItem.isRoot()) {
          resetToRoot();
        } else {
          setZoomedInPath(newItem.node.path);
        }
      }
    },
    ArrowRight: () => {
      const newItem = findNode(selected)?.children()[0];
      if (newItem) {
        itemStore.focusByPath(newItem.node.path);
      }
    },
    Enter: resetToRoot,
  });
}
