import { SqValuePath } from "@quri/squiggle-lang";

import { useViewerContext } from "../ViewerProvider.js";
import { focusSqValueHeader, keyboardEventHandler } from "./utils.js";

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
      focusSqValueHeader(selected, itemStore);
    }, 1);
  }

  return keyboardEventHandler({
    ArrowDown: () => {
      const newPath = findNode(selected)?.nextSibling()?.node.path;
      if (newPath) {
        setZoomedInPath(newPath);
      }
    },
    ArrowUp: () => {
      const newPath = findNode(selected)?.prevSibling()?.node.path;
      if (newPath) {
        setZoomedInPath(newPath);
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
        focusSqValueHeader(newItem.node.path, itemStore);
      }
    },
    Enter: resetToRoot,
  });
}
