import { result } from "@quri/squiggle-lang";
export class RelativeValue {
  // react components can depend on RelativeValue as a hook dependency, so take care to keep it immutable
  readonly median: number;
  readonly min: number;
  readonly max: number;
  readonly db: number;

  constructor({
    median,
    min,
    max,
    db,
  }: {
    median: number;
    min: number;
    max: number;
    db: number;
  }) {
    this.median = median;
    this.min = min;
    this.max = max;
    this.db = db;
  }
}

export type RelativeValueResult = result<RelativeValue, string>;