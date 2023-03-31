import { Model } from "@/model/utils";
import { jsonData, ModelCache } from "./cache";
import { RelativeValueResult } from "./types";

export class ModelEvaluator {
  constructor(
    private model: Model, // unused for now
    private cache: ModelCache
  ) {}

  static create(model: Model) {
    const cache: ModelCache = jsonData
      .flatMap((r) => r.models)
      .find((r) => model && r.id == model.id) || {
      id: model.id,
      relativeValues: {},
    };

    return new ModelEvaluator(model, cache);
  }

  compare(id1: string, id2: string): RelativeValueResult {
    const cachedValue = this.cache.relativeValues[id1]?.[id2];
    if (!this.model.modified && cachedValue) {
      return cachedValue;
    }

    // TODO - evaluate and cache
    return {
      ok: false,
      value: `Combination ${id1} and ${id2} not cached`,
    };
  }
}
