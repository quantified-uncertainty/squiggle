import data from "@models/cache/cache.json";
import { RelativeValueResult } from "./RelativeValue";

export type ModelCache = {
  id: string;
  relativeValues: Record<string, Record<string, RelativeValueResult>>;
};

export type CatalogCache = {
  id: string;
  models: ModelCache[];
};

export const jsonData: CatalogCache[] = data as CatalogCache[];
