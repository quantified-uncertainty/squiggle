import { defaultEnvironment } from "@quri/squiggle-lang";
import React from "react";
import { LocalItemSettings, MergedItemSettings, Path } from "./utils";

type ViewerContextShape = {
  // Note that we don't store settings themselves in the context (that would cause rerenders of the entire tree on each settings update).
  // Instead, we keep settings in local state and notify the global context via setSettings to pass them down the component tree again if it got rebuilt from scratch.
  // See ./SquiggleViewer.tsx and ./VariableBox.tsx for other implementation details on this.
  getSettings(path: Path): LocalItemSettings;
  getMergedSettings(path: Path): MergedItemSettings;
  setSettings(path: Path, value: LocalItemSettings): void;
};

export const ViewerContext = React.createContext<ViewerContextShape>({
  getSettings: () => ({ collapsed: false }),
  getMergedSettings: () => ({
    collapsed: false,
    // copy-pasted from SquiggleChart
    chartSettings: {
      start: 0,
      stop: 10,
      count: 100,
    },
    distributionPlotSettings: {
      showSummary: false,
      logX: false,
      expY: false,
    },
    environment: defaultEnvironment,
    height: 150,
  }),
  setSettings() {},
});
