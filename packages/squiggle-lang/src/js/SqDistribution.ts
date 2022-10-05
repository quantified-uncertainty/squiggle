import * as RSDistribution from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution.gen";
import { distributionTag as Tag } from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution_tag";
import { environment } from "../rescript/ForTS/ForTS__Types.gen";
import { SqDistributionError } from "./SqDistributionError";
import { wrapPointSetDist } from "./SqPointSetDist";
import { resultMap2 } from "./types";

type T = RSDistribution.distribution;
export { Tag as SqDistributionTag };

export const wrapDistribution = (value: T): SqDistribution => {
  const tag = RSDistribution.getTag(value);

  return new tagToClass[tag](value);
};

abstract class SqAbstractDistribution {
  abstract tag: Tag;

  constructor(private _value: T) {}

  protected valueMethod = <IR>(rsMethod: (v: T) => IR | null | undefined) => {
    const value = rsMethod(this._value);
    if (!value) throw new Error("Internal casting error");
    return value;
  };

  pointSet(env: environment) {
    const innerResult = RSDistribution.toPointSet(this._value, env);
    return resultMap2(
      innerResult,
      wrapPointSetDist,
      (v: RSDistribution.distributionError) => new SqDistributionError(v)
    );
  }

  toString() {
    RSDistribution.toString(this._value);
  }

  mean(env: environment) {
    return resultMap2(
      RSDistribution.mean({ env }, this._value),
      (v: number) => v,
      (e: RSDistribution.distributionError) => new SqDistributionError(e)
    );
  }

  pdf(env: environment, n: number) {
    return resultMap2(
      RSDistribution.pdf({ env }, this._value, n),
      (v: number) => v,
      (e: RSDistribution.distributionError) => new SqDistributionError(e)
    );
  }

  cdf(env: environment, n: number) {
    return resultMap2(
      RSDistribution.cdf({ env }, this._value, n),
      (v: number) => v,
      (e: RSDistribution.distributionError) => new SqDistributionError(e)
    );
  }

  inv(env: environment, n: number) {
    return resultMap2(
      RSDistribution.inv({ env }, this._value, n),
      (v: number) => v,
      (e: RSDistribution.distributionError) => new SqDistributionError(e)
    );
  }

  stdev(env: environment) {
    return resultMap2(
      RSDistribution.stdev({ env }, this._value),
      (v: number) => v,
      (e: RSDistribution.distributionError) => new SqDistributionError(e)
    );
  }
}

export class SqPointSetDistribution extends SqAbstractDistribution {
  tag = Tag.PointSet as const;

  value() {
    return wrapPointSetDist(this.valueMethod(RSDistribution.getPointSet));
  }
}

export class SqSampleSetDistribution extends SqAbstractDistribution {
  tag = Tag.SampleSet as const;

  // value(): number[] {
  //   return this.valueMethod(RSDistribution.getSampleSet);
  // }
}

export class SqSymbolicDistribution extends SqAbstractDistribution {
  tag = Tag.Symbolic as const;

  // not wrapped for TypeScript yet
  // value() {
  //   return this.valueMethod(RSDistribution.getSymbolic);
  // }
}

const tagToClass = {
  [Tag.PointSet]: SqPointSetDistribution,
  [Tag.SampleSet]: SqSampleSetDistribution,
  [Tag.Symbolic]: SqSymbolicDistribution,
} as const;

export type SqDistribution =
  | SqPointSetDistribution
  | SqSampleSetDistribution
  | SqSymbolicDistribution;
