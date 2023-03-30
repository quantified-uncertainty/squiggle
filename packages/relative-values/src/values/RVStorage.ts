import { RelativeValueResult } from "./RelativeValue";
import { ModelData, searchRelativeValues } from "./RVCache";
export class RVStorage {
  constructor(public db: ModelData) {}

  compare(id1: string, id2: string): RelativeValueResult {
    return searchRelativeValues(this.db, id1, id2)
  }
}