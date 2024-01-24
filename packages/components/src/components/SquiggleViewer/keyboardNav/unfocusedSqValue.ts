import { SqValuePath } from "@quri/squiggle-lang";

import { toggleCollapsed, useViewerContext } from "../ViewerProvider.js";
import { focusSqValueHeader, keyboardEventHandler } from "./utils.js";

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
      newPath && focusSqValueHeader(newPath, itemStore);
    },
    ArrowUp: () => {
      const newPath = findNode(selected)?.prev()?.node.path;
      newPath && focusSqValueHeader(newPath, itemStore);
    },
    ArrowLeft: () => {
      const newItem = findNode(selected)?.parent();
      newItem &&
        !newItem.isRoot() &&
        focusSqValueHeader(newItem.node.path, itemStore);
    },
    ArrowRight: () => {
      toggleCollapsed(itemStore, selected);
    },
    Enter: () => {
      setFocused(selected);
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
