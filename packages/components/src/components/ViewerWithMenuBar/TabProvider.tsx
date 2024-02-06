import { createContext, useContext } from "react";

import { ViewerTab } from "../../lib/utility.js";

type TabContextShape = {
  tab?: ViewerTab;
  setViewerTab: (tab: ViewerTab) => void;
};

export const TabContext = createContext<TabContextShape>({
  tab: undefined,
  setViewerTab: () => {},
});

export function useTabContext() {
  return useContext(TabContext);
}
