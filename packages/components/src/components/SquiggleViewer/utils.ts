import { SqValueLocation } from "@quri/squiggle-lang";
import {
  PartialPlaygroundSettings,
  PlaygroundSettings,
} from "../PlaygroundSettings.js";
import { SqValue } from "@quri/squiggle-lang";

export type LocalItemSettings = {
  collapsed: boolean;
} & Pick<
  PartialPlaygroundSettings,
  "distributionChartSettings" | "functionChartSettings"
>;

export type MergedItemSettings = PlaygroundSettings;

export function locationAsString(location: SqValueLocation) {
  return location.path.items.join(".");
}

export function locationToShortName(
  location: SqValueLocation
): string | undefined {
  const isTopLevel = location.path.items.length === 0;
  return isTopLevel
    ? { result: undefined, bindings: "Bindings" }[location.path.root]
    : String(location.path.items[location.path.items.length - 1]);
}

export function extractLocationFromValue(
  value: SqValue,
  location: SqValueLocation
) {
  // TODO
  return value;
}
