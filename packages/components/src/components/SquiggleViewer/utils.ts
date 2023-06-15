import { SqValueLocation } from "@quri/squiggle-lang";
import {
  PartialPlaygroundSettings,
  PlaygroundSettings,
} from "../PlaygroundSettings.js";

export type LocalItemSettings = {
  collapsed: boolean;
} & PartialPlaygroundSettings;

export type MergedItemSettings = PlaygroundSettings;

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
