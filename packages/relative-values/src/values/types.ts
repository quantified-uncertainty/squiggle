import { result } from "@quri/squiggle-lang";
import _ from "lodash";

export type RelativeValue = Readonly<{
  median: number;
  mean: number;
  min: number;
  max: number;
  uncertainty: number;
}>;

export type RelativeValueResult = result<RelativeValue, string>;

export type ModelCache = {
  id: string;
  relativeValues: Record<string, Record<string, RelativeValueResult>>;
};

export type CatalogCache = {
  id: string;
  models: ModelCache[];
};
