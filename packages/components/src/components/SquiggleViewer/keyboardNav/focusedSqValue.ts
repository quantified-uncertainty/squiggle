import { SqValuePath } from "@quri/squiggle-lang";

import { useViewerContext } from "../ViewerProvider.js";
import { focusSqValueHeader, keyboardEventHandler } from "./utils.js";

const validKeys = [
  "ArrowDown",
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
] as const;

export function useFocusedSqValueKeyEvent(selected: SqValuePath) {
  const { setFocused, itemStore, findNode } = useViewerContext();

  function resetToRoot() {
    setFocused(undefined);

    // This timeout is a hack to make sure the header is focused after the reset
    setTimeout(() => {
      focusSqValueHeader(selected, itemStore);
    }, 1);
  }

  return keyboardEventHandler(validKeys, {
    ArrowDown: () => {
      const newItem = findNode(selected)?.children()[0];
      if (newItem) {
        focusSqValueHeader(newItem.node.path, itemStore);
      }
    },
    ArrowUp: () => {
      const newItem = findNode(selected)?.parent();
      if (newItem) {
        if (newItem.isRoot()) {
          resetToRoot();
        } else {
          setFocused(newItem.node.path);
        }
      }
    },
    ArrowLeft: () => {
      const newPath = findNode(selected)?.prevSibling()?.node.path;
      if (newPath) {
        setFocused(newPath);
      }
    },
    ArrowRight: () => {
      const newPath = findNode(selected)?.nextSibling()?.node.path;
      if (newPath) {
        setFocused(newPath);
      }
    },
    Enter: resetToRoot,
  });
}
