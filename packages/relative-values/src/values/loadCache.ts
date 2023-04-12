// This file can't be included in CLI script that builds a cache, because
// @models/cache/ dir doesn't exist yet and the import will fail.
import { Model } from "@/model/utils";
import data from "@models/cache/cache.json";
import { CatalogCache, ModelCache } from "./types";
import { ModelEvaluator } from "./ModelEvaluator";

export const jsonData: CatalogCache[] = data as CatalogCache[];

export function createModelEvaluatorWithCache(model: Model) {
  const cache: ModelCache = jsonData
    .flatMap((r) => r.models)
    .find((r) => model && r.id == model.id) || {
    id: model.id,
    relativeValues: {},
  };

  return ModelEvaluator.create(model, cache);
}
