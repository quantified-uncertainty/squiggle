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

export function extractSubvalueByLocation(
  value: SqValue,
  location: SqValueLocation
): SqValue | undefined {
  if (!value.location) {
    return;
  }

  for (const key of location.path.items) {
    let nextValue: SqValue | undefined;
    if (typeof key === "number" && value.tag === "Array") {
      nextValue = value.value.getValues()[key];
    } else if (typeof key === "string" && value.tag === "Record") {
      nextValue = value.value.get(key);
    }
    if (!nextValue) {
      return;
    }
    value = nextValue;
  }
  return value;
}
