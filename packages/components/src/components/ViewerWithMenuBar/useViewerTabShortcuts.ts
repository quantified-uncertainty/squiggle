import { useMemo } from "react";

import { Shortcut, useGlobalShortcuts } from "@quri/ui";

import {
  isCustomVisibleRootPath,
  SelectableViewerTab,
  ViewerTab,
} from "../../lib/utility.js";

function incrementViewerTab(
  shownTabs: SelectableViewerTab[],
  tab: ViewerTab,
  direction: "backwards" | "forwards"
): SelectableViewerTab {
  if (isCustomVisibleRootPath(tab)) {
    return "Variables";
  }
  const index = shownTabs.indexOf(tab as SelectableViewerTab);
  if (direction === "forwards" && index >= 0 && index < shownTabs.length - 1) {
    return shownTabs[index + 1];
  } else if (direction === "backwards" && index > 0) {
    return shownTabs[index - 1];
  } else {
    return tab;
  }
}

type UseViewerTabShortcutsProps = {
  enableGlobalShortcuts: boolean;
  viewerTab: ViewerTab;
  setViewerTab: (tab: ViewerTab) => void;
  shownTabs: SelectableViewerTab[];
};

export function useViewerTabShortcuts({
  enableGlobalShortcuts,
  viewerTab,
  setViewerTab,
  shownTabs,
}: UseViewerTabShortcutsProps) {
  const shortCuts: [Shortcut, () => void][] = useMemo(() => {
    return [
      [
        {
          metaKey: true,
          key: "PageDown",
        },
        () =>
          setViewerTab(incrementViewerTab(shownTabs, viewerTab, "forwards")),
      ],
      [
        {
          metaKey: true,
          key: "PageUp",
        },
        () =>
          setViewerTab(incrementViewerTab(shownTabs, viewerTab, "backwards")),
      ],
    ];
  }, [shownTabs, viewerTab, setViewerTab]);

  useGlobalShortcuts(enableGlobalShortcuts ? shortCuts : []);
}
