import { SqValuePath } from "@quri/squiggle-lang";

import { useViewerContext } from "../ViewerProvider.js";
import { focusSqValue, keyboardEventHandler } from "./utils.js";

export function useFocusedSqValueKeyEvent(selected: SqValuePath) {
  const { setFocused, itemStore, findNode } = useViewerContext();

  function resetToRoot() {
    setFocused(undefined);

    // This timeout is a hack to make sure the header is focused after the reset
    setTimeout(() => {
      focusSqValue(selected, itemStore);
    }, 1);
  }

  return keyboardEventHandler({
    ArrowDown: () => {
      const newPath = findNode(selected)?.nextSibling()?.node.path;
      if (newPath) {
        setFocused(newPath);
      }
    },
    ArrowUp: () => {
      const newPath = findNode(selected)?.prevSibling()?.node.path;
      if (newPath) {
        setFocused(newPath);
      }
    },
    ArrowLeft: () => {
      const newItem = findNode(selected)?.parent();
      if (newItem) {
        if (newItem.isRoot()) {
          resetToRoot();
        } else {
          setFocused(newItem.node.path);
        }
      }
    },
    ArrowRight: () => {
      const newItem = findNode(selected)?.children()[0];
      if (newItem) {
        focusSqValue(newItem.node.path, itemStore);
      }
    },
    Enter: resetToRoot,
    " ": () => {},
  });
}
