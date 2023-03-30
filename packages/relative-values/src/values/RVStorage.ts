import { result } from "@quri/squiggle-lang";
import { RelativeValue } from "./RelativeValue";
import { ModelData, distToRelativeValue } from "./SCache";

export type RelativeValueResult = result<RelativeValue, string>;
export class RVStorage {
  constructor(public db: ModelData) {}

  compare(id1: string, id2: string): RelativeValueResult {
    if (!this.db.relativeValues[id1] || !this.db.relativeValues[id1][id2]) {
      return {
        ok: false,
        value: `Combination ${id1} and ${id2} not cached`,
      };
    }
    return {
      ok: true,
      value: distToRelativeValue(this.db.relativeValues[id1][id2].value),
    };
  }
}
