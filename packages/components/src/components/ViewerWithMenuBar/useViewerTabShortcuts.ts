import { useMemo } from "react";

import { Shortcut, useGlobalShortcuts } from "@quri/ui";

import { ViewerTab } from "../../lib/utility.js";

const tabs = ["Imports", "Variables", "Exports", "Result", "AST"] as const;

function incrementViewerTab(
  tab: ViewerTab,
  direction: "backwards" | "forwards"
): ViewerTab {
  if (typeof tab === "object" && tab.tag === "CustomResultPath") {
    return "Variables";
  }
  const index = tabs.indexOf(tab as (typeof tabs)[number]);
  if (direction === "forwards" && index >= 0 && index < tabs.length - 1) {
    return tabs[index + 1];
  } else if (direction === "backwards" && index > 0) {
    return tabs[index - 1];
  } else {
    return tab;
  }
}

type UseViewerTabShortcutsProps = {
  shouldUseGlobalShortcuts: boolean;
  viewerTab: ViewerTab;
  setViewerTab: (tab: ViewerTab) => void;
};

export function useViewerTabShortcuts({
  shouldUseGlobalShortcuts,
  viewerTab,
  setViewerTab,
}: UseViewerTabShortcutsProps) {
  const shortCuts: [Shortcut, () => void][] = useMemo(() => {
    return [
      [
        {
          metaKey: true,
          key: "PageDown",
        },
        () => setViewerTab(incrementViewerTab(viewerTab, "forwards")),
      ],
      [
        {
          metaKey: true,
          key: "PageUp",
        },
        () => setViewerTab(incrementViewerTab(viewerTab, "backwards")),
      ],
    ];
  }, [viewerTab, setViewerTab]);

  useGlobalShortcuts(shouldUseGlobalShortcuts ? shortCuts : []);
}
