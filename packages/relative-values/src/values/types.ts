import { result } from "@quri/squiggle-lang";

export type RelativeValue = Readonly<{
  median: number;
  min: number;
  max: number;
  db: number;
}>;

export function hasInvalid(obj: RelativeValue): boolean {
  return Object.values(obj).some((value) => !Number.isNaN(value) && !value);
}

export type RelativeValueResult = result<RelativeValue, string>;

export type ModelCache = {
  id: string;
  relativeValues: Record<string, Record<string, RelativeValueResult>>;
};

export type CatalogCache = {
  id: string;
  models: ModelCache[];
};
