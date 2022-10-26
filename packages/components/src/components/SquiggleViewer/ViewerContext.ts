import { SqValueLocation } from "@quri/squiggle-lang";
import React from "react";
import { LocalItemSettings, MergedItemSettings } from "./utils";
import { viewSettingsSchema } from "../ViewSettingsForm";

type ViewerContextShape = {
  // Note that we don't store settings themselves in the context (that would cause rerenders of the entire tree on each settings update).
  // Instead, we keep settings in local state and notify the global context via setSettings to pass them down the component tree again if it got rebuilt from scratch.
  // See ./SquiggleViewer.tsx and ./VariableBox.tsx for other implementation details on this.
  getSettings(location: SqValueLocation): LocalItemSettings;
  getMergedSettings(location: SqValueLocation): MergedItemSettings;
  setSettings(location: SqValueLocation, value: LocalItemSettings): void;
  enableLocalSettings: boolean; // show local settings icon in the UI
};

export const ViewerContext = React.createContext<ViewerContextShape>({
  getSettings: () => ({ collapsed: false }),
  getMergedSettings: () => viewSettingsSchema.getDefault(),
  setSettings() {},
  enableLocalSettings: false,
});
