import React from "react";
import { ItemSettings, Path } from "./utils";

type ViewerContextShape = {
  // Note that we don't store settings themselves in the context (that would cause rerenders of the entire tree on each settings update).
  // Instead, we keep settings in local state and notify the global context via setSettings to pass them down the component tree again if it got rebuilt from scratch.
  // See ./SquiggleViewer.tsx and ./VariableBox.tsx for other implementation details on this.
  getSettings(path: Path): ItemSettings;
  setSettings(path: Path, value: ItemSettings): void;
};

export const ViewerContext = React.createContext<ViewerContextShape>({
  getSettings: () => ({ collapsed: false }),
  setSettings() {},
});
