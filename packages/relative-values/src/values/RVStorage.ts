import { Model } from "@/model/utils";
import { ModelCache } from "./cache";
import { RelativeValueResult } from "./RelativeValue";

export class RVStorage {
  constructor(private model: Model, private cache: ModelCache) {}

  compare(id1: string, id2: string): RelativeValueResult {
    if (!this.cache.relativeValues[id1]?.[id2]) {
      return {
        ok: false,
        value: `Combination ${id1} and ${id2} not cached`,
      };
    }
    return this.cache.relativeValues[id1]?.[id2];
  }
}
