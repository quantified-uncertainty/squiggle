import { SqValuePath } from "@quri/squiggle-lang";

import { toggleCollapsed, useViewerContext } from "../ViewerProvider.js";
import { focusHeader, keyboardEventHandler } from "./utils.js";

const validKeys = [
  "ArrowDown",
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
  "e",
] as const;

export function useUnfocusedSqValueKeyEvent(selected: SqValuePath) {
  const { setFocused, itemStore, editor, findNode } = useViewerContext();

  return keyboardEventHandler(validKeys, {
    ArrowDown: () => {
      const newPath = findNode(selected)?.next()?.node.path;
      newPath && focusHeader(newPath, itemStore);
    },
    ArrowUp: () => {
      const newPath = findNode(selected)?.prev()?.node.path;
      newPath && focusHeader(newPath, itemStore);
    },
    ArrowLeft: () => {
      const newItem = findNode(selected)?.parent();
      newItem && !newItem.isRoot() && focusHeader(newItem.node.path, itemStore);
    },
    ArrowRight: () => {
      toggleCollapsed(itemStore, selected);
    },
    Enter: () => {
      setFocused(selected);
    },
    e: () => {
      const value = findNode(selected)?.value();
      const location = value?.context?.findLocation();

      if (location) {
        editor?.scrollTo(location.start.offset, true);
      }
    },
  });
}
