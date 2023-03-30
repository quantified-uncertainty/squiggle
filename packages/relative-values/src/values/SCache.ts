import data from "../relative_value_cache.json";
import { RelativeValue } from "./RelativeValue";

type Distribution = {
  median: number;
  min: number;
  max: number;
  db: number;
};

export const distToRelativeValue = (d: Distribution) => {
  return new RelativeValue({ median: d.median, min: d.min, max: d.max, db: d.db });
};

type CacheData = {
  ok: boolean;
  value: Distribution;
};

export type ModelData = {
  name: string;
  relativeValues: Record<string, Record<string, CacheData>>;
};

export type CatalogCache = {
  id: string;
  models: ModelData[];
};

export const jsonData: CatalogCache[] = data as CatalogCache[];
