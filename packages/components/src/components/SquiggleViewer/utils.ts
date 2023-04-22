import { SqValueLocation } from "@quri/squiggle-lang";
import { PartialViewSettings, ViewSettings } from "../ViewSettingsForm.js";

export type LocalItemSettings = {
  collapsed: boolean;
} & PartialViewSettings;

export type MergedItemSettings = ViewSettings;

export const locationAsString = (location: SqValueLocation) =>
  location.path.items.join(".");

export function locationToShortName(
  location: SqValueLocation
): string | undefined {
  const isTopLevel = location.path.items.length === 0;
  return isTopLevel
    ? { result: undefined, bindings: "Bindings" }[location.path.root]
    : String(location.path.items[location.path.items.length - 1]);
}
