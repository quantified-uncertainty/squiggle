import data from "@/../models/cache/cache.json";
import { result } from "@quri/squiggle-lang";
import { RelativeValue, RelativeValueResult } from "./RelativeValue";

type Distribution = {
  median: number;
  min: number;
  max: number;
  db: number;
};

type DistributionResult = result<Distribution, string>;

export type ModelData = {
  name: string;
  relativeValues: Record<string, Record<string, DistributionResult>>;
};

export type CatalogCache = {
  id: string;
  models: ModelData[];
};

export const jsonData: CatalogCache[] = data as CatalogCache[];

const distToRelativeValue = (d: Distribution) => {
  return new RelativeValue({
    median: d.median,
    min: d.min,
    max: d.max,
    db: d.db,
  });
};

const distResultToRelativeValueResult = (
  c: DistributionResult
): RelativeValueResult => {
  if (c.ok) {
    return {
      ok: true,
      value: distToRelativeValue(c.value),
    };
  } else {
    return c;
  }
};

export const searchRelativeValues = (
  model: ModelData,
  id1: string,
  id2: string
): RelativeValueResult => {
  if (!model.relativeValues[id1] || !model.relativeValues[id1][id2]) {
    return {
      ok: false,
      value: `Combination ${id1} and ${id2} not cached`,
    };
  }
  return distResultToRelativeValueResult(model.relativeValues[id1][id2]);
};
