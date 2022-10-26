import { SqValueLocation } from "@quri/squiggle-lang";
import { PartialViewSettings, ViewSettings } from "../ViewSettingsForm";

export type LocalItemSettings = {
  collapsed: boolean;
} & PartialViewSettings;

export type MergedItemSettings = ViewSettings;

export const locationAsString = (location: SqValueLocation) =>
  location.path.items.join(".");
