import * as RSDistribution from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution.gen";
import { distributionTag as Tag } from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution_tag";
import { environment } from "../rescript/ForTS/ForTS__Types.gen";
import { DistributionError } from "./DistributionError";
import { wrapPointSetDist } from "./PointSetDist";
import { resultMap2 } from "./types";

type T = RSDistribution.distribution;
export { Tag };

export const wrapDistribution = (value: T): Distribution => {
  const tag = RSDistribution.getTag(value);

  return new tagToClass[tag](value);
};

abstract class AbstractDistribution {
  abstract tag: Tag;
  _value: T;

  constructor(value: T) {
    this._value = value;
  }

  pointSet(env: environment) {
    const innerResult = RSDistribution.toPointSet(this._value, env);
    return resultMap2(
      innerResult,
      wrapPointSetDist,
      (v: RSDistribution.distributionError) => new DistributionError(v)
    );
  }

  toString() {
    RSDistribution.toString(this._value);
  }

  mean(env: environment) {
    return resultMap2(
      RSDistribution.mean({ env }, this._value),
      (v: number) => v,
      (e: RSDistribution.distributionError) => new DistributionError(e)
    );
  }

  inv(env: environment, n: number) {
    return resultMap2(
      RSDistribution.inv({ env }, this._value, n),
      (v: number) => v,
      (e: RSDistribution.distributionError) => new DistributionError(e)
    );
  }

  stdev(env: environment) {
    return resultMap2(
      RSDistribution.stdev({ env }, this._value),
      (v: number) => v,
      (e: RSDistribution.distributionError) => new DistributionError(e)
    );
  }
}

const valueMethod = <IR>(
  _this: AbstractDistribution,
  rsMethod: (v: T) => IR | null | undefined
) => {
  const value = rsMethod(_this._value);
  if (!value) throw new Error("Internal casting error");
  return value;
};

export class PointSetDistribution extends AbstractDistribution {
  tag = Tag.DtPointSet;

  value() {
    return valueMethod(this, RSDistribution.getPointSet);
  }
}

export class SampleSetDistribution extends AbstractDistribution {
  tag = Tag.DtSampleSet;

  value() {
    return valueMethod(this, RSDistribution.getSampleSet);
  }
}

export class SymbolicDistribution extends AbstractDistribution {
  tag = Tag.DtSymbolic;

  value() {
    return valueMethod(this, RSDistribution.getSymbolic);
  }
}

const tagToClass = {
  [Tag.DtPointSet]: PointSetDistribution,
  [Tag.DtSampleSet]: SampleSetDistribution,
  [Tag.DtSymbolic]: SymbolicDistribution,
} as const;

export type Distribution =
  | PointSetDistribution
  | SampleSetDistribution
  | SymbolicDistribution;
