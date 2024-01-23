import { SqValuePath } from "@quri/squiggle-lang";

import {
  ItemStore,
  toggleCollapsed,
  useViewerContext,
} from "./ViewerProvider.js";

type ArrowEvent =
  | "ArrowDown"
  | "ArrowUp"
  | "ArrowLeft"
  | "ArrowRight"
  | "Enter";

export function isArrowEvent(str: string): str is ArrowEvent {
  return ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Enter"].includes(
    str
  );
}

const focusHeader = (path: SqValuePath, itemStore: ItemStore) => {
  const header = itemStore.handles[path.uid()]?.element.querySelector("header");
  if (header) {
    header.focus();
  }
};

export function useItemEvent(selected: SqValuePath) {
  const { setFocused, itemStore, findNode } = useViewerContext();

  return (event: string) => {
    if (isArrowEvent(event)) {
      const myNode = findNode(selected);
      if (!myNode) {
        return;
      }

      switch (event) {
        case "ArrowDown": {
          const newPath = myNode.next()?.node.path;
          newPath && focusHeader(newPath, itemStore);
          break;
        }
        case "ArrowUp": {
          const newPath = myNode.prev()?.node.path;
          newPath && focusHeader(newPath, itemStore);
          break;
        }
        case "ArrowLeft": {
          const newItem = myNode.parent();
          newItem &&
            !newItem.isRoot() &&
            focusHeader(newItem.node.path, itemStore);
          break;
        }
        case "ArrowRight": {
          toggleCollapsed(itemStore, selected);
          break;
        }
        case "Enter": {
          setFocused(selected);
          break;
        }
      }
    }
  };
}

export function useFocusedItemEvent(selected: SqValuePath) {
  const { setFocused, itemStore, findNode } = useViewerContext();

  function resetToRoot() {
    setFocused(undefined);
    setTimeout(() => {
      focusHeader(selected, itemStore);
    }, 1);
  }

  return (event: string) => {
    const myNode = findNode(selected);
    if (!myNode) {
      return;
    }

    if (isArrowEvent(event)) {
      switch (event) {
        case "ArrowDown": {
          const newItem = myNode.children()[0];
          if (newItem) {
            focusHeader(newItem.node.path, itemStore);
          }
          break;
        }
        case "ArrowUp": {
          const newItem = myNode.parent();
          if (newItem) {
            if (newItem.isRoot()) {
              resetToRoot();
            } else {
              setFocused(newItem.node.path);
            }
          }
          break;
        }
        case "ArrowLeft": {
          const newPath = myNode.prevSibling()?.node.path;
          if (newPath) {
            setFocused(newPath);
          }
          break;
        }
        case "ArrowRight": {
          const newPath = myNode.nextSibling()?.node.path;
          if (newPath) {
            setFocused(newPath);
          }
          break;
        }
        case "Enter": {
          resetToRoot();
          break;
        }
      }
    }
  };
}
