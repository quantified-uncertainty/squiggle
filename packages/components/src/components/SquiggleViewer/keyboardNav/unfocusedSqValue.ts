import { SqValuePath } from "@quri/squiggle-lang";

import { toggleCollapsed, useViewerContext } from "../ViewerProvider.js";
import { focusSqValue, keyboardEventHandler } from "./utils.js";

export function useUnfocusedSqValueKeyEvent(selected: SqValuePath) {
  const { setFocused, itemStore, editor, findNode } = useViewerContext();

  return keyboardEventHandler({
    ArrowDown: () => {
      const newPath = findNode(selected)?.next()?.node.path;
      newPath && focusSqValue(newPath, itemStore);
    },
    ArrowUp: () => {
      const newPath = findNode(selected)?.prev()?.node.path;
      newPath && focusSqValue(newPath, itemStore);
    },
    ArrowLeft: () => {
      const newItem = findNode(selected)?.parent();
      newItem &&
        !newItem.isRoot() &&
        focusSqValue(newItem.node.path, itemStore);
    },
    ArrowRight: () => {
      const newItem = findNode(selected)?.children().at(0);
      const isCollapsed = itemStore.state[selected.uid()]?.collapsed;

      if (newItem) {
        if (isCollapsed) {
          toggleCollapsed(itemStore, selected);
          setTimeout(() => {
            focusSqValue(newItem.node.path, itemStore);
          }, 1);
        } else {
          focusSqValue(newItem.node.path, itemStore);
        }
      }
    },
    Enter: () => {
      setFocused(selected);
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
