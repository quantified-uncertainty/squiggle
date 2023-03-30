import { SqSampleSetDistribution } from "@quri/squiggle-lang/dist/src/public/SqDistribution";
import * as d3 from "d3";

export class RelativeValue {
  // react components can depend on RelativeValue as a hook dependency, so take care to keep it immutable
  readonly median: number;
  readonly min: number;
  readonly max: number;
  readonly db: number;

  histogramCache: Map<string, d3.Bin<number, number>[]> = new Map();

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

  // histogramData(logDomain: [number, number], bins: number) {
  //   const key = `${logDomain[0]}/${logDomain[1]}/${bins}`;

  //   const cached = this.histogramCache.get(key);
  //   if (cached) {
  //     return cached;
  //   }

  //   const histogramDataFn = d3
  //     .bin()
  //     .value((d) => {
  //       const value = Math.log(d);
  //       return Math.max(logDomain[0], Math.min(logDomain[1], value));
  //     })
  //     .domain(logDomain)
  //     .thresholds(bins);

  //   const sortedSamples = [...this.dist.value().samples].sort((a, b) => a - b);
  //   const result = histogramDataFn(sortedSamples);
  //   this.histogramCache.set(key, result);
  //   return result;
  // }
}
