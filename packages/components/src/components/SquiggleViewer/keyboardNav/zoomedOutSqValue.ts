import { SqValuePath } from "@quri/squiggle-lang";

import { ViewerTab } from "../../../lib/utility.js";
import { useTabContext } from "../../ViewerWithMenuBar/TabProvider.js";
import { toggleCollapsed, useViewerContext } from "../ViewerProvider.js";
import { keyboardEventHandler } from "./utils.js";

const tabs = ["Imports", "Variables", "Exports", "Result", "AST"] as const;

function nextTab(tab: ViewerTab, isNext: boolean): ViewerTab {
  if (typeof tab === "object" && tab.tag === "CustomResultPath") {
    return "Variables";
  }
  const index = tabs.indexOf(tab as (typeof tabs)[number]);
  if (isNext && index >= 0 && index < tabs.length - 1) {
    return tabs[index + 1];
  } else if (!isNext && index > 0) {
    return tabs[index - 1];
  } else {
    return tab;
  }
}

export function useZoomedOutSqValueKeyEvent(selected: SqValuePath) {
  const {
    setZoomedInPath: setZoomedInPath,
    itemStore,
    editor,
    findNode,
    rootValue,
  } = useViewerContext();

  const { tab, setViewerTab } = useTabContext();

  return keyboardEventHandler({
    ArrowDown: () => {
      const newPath = findNode(selected)?.next()?.node.path;
      newPath && itemStore.focusOnPath(newPath);
    },
    "Shift+ArrowUp": () => {
      tab && setViewerTab(nextTab(tab, false));
      setTimeout(() => {
        const rootPath = rootValue?.context?.path;
        if (rootPath) {
          const firstNode = findNode(rootPath)?.children().at(0);
          console.log("HI", rootPath, firstNode?.node.path);
          firstNode && itemStore.focusOnPath(firstNode.node.path);
        }
      }, 5);
    },
    "Shift+ArrowDown": () => {
      tab && setViewerTab(nextTab(tab, true));
    },
    ArrowUp: () => {
      const newPath = findNode(selected)?.prev()?.node.path;
      newPath && itemStore.focusOnPath(newPath);
    },
    ArrowLeft: () => {
      const newItem = findNode(selected)?.parent();
      newItem && !newItem.isRoot() && itemStore.focusOnPath(newItem.node.path);
    },
    ArrowRight: () => {
      const newItem = findNode(selected)?.children().at(0);
      const isCollapsed = itemStore.state[selected.uid()]?.collapsed;

      if (newItem) {
        if (isCollapsed) {
          toggleCollapsed(itemStore, selected);
          setTimeout(() => {
            itemStore.focusOnPath(newItem.node.path);
          }, 1);
        } else {
          itemStore.focusOnPath(newItem.node.path);
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
