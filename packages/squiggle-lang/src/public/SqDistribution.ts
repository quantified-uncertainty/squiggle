import { SampleSetDist } from "../dist/SampleSetDist/SampleSetDist";
import { Env } from "../dist/env";
import { SqDistributionError } from "./SqDistributionError";
import { wrapPointSet } from "./SqPointSet";
import * as Result from "../utility/result";
import { BaseDist } from "../dist/BaseDist";
import { DistError } from "../dist/DistError";
import { SymbolicDist } from "../dist/SymbolicDist";
import { PointSetDist } from "../dist/PointSetDist";
import { Ok, result } from "../utility/result";

export enum SqDistributionTag {
  PointSet = "PointSet",
  SampleSet = "SampleSet",
  Symbolic = "Symbolic",
}

export const wrapDistribution = (value: BaseDist): SqDistribution => {
  if (value instanceof SymbolicDist) {
    return new SqSymbolicDistribution(value);
  } else if (value instanceof SampleSetDist) {
    return new SqSampleSetDistribution(value);
  } else if (value instanceof PointSetDist) {
    return new SqPointSetDistribution(value);
  }
  throw new Error(`Unknown value ${value}`);
};

abstract class SqAbstractDistribution<T extends BaseDist> {
  abstract tag: SqDistributionTag;

  constructor(protected _value: T) {}

  pointSet(env: Env) {
    const innerResult = this._value.toPointSetDist(env);
    return Result.fmap2(
      innerResult,
      (dist) => wrapPointSet(dist.pointSet),
      (e: DistError) => new SqDistributionError(e)
    );
  }

  toString() {
    return this._value.toString();
  }

  toSparkline(env: Env) {
    return this._value.toSparkline(20, env);
  }

  mean(env: Env): number {
    return this._value.mean();
  }

  pdf(env: Env, n: number) {
    return Result.fmap2(
      this._value.pdf(n, { env }),
      (v: number) => v,
      (e: DistError) => new SqDistributionError(e)
    );
  }

  cdf(env: Env, n: number): result<number, SqDistributionError> {
    return Ok(this._value.cdf(n));
  }

  inv(env: Env, n: number): result<number, SqDistributionError> {
    return Ok(this._value.inv(n));
  }

  stdev(env: Env) {
    return Result.fmap2(
      this._value.stdev(),
      (v: number) => v,
      (e: DistError) => new SqDistributionError(e)
    );
  }
}

export class SqPointSetDistribution extends SqAbstractDistribution<PointSetDist> {
  tag = SqDistributionTag.PointSet as const;

  value() {
    return wrapPointSet(this._value.pointSet);
  }
}

export class SqSampleSetDistribution extends SqAbstractDistribution<SampleSetDist> {
  tag = SqDistributionTag.SampleSet as const;

  value(): SampleSetDist {
    return this._value;
  }
}

export class SqSymbolicDistribution extends SqAbstractDistribution<SymbolicDist> {
  tag = SqDistributionTag.Symbolic as const;

  // not wrapped for TypeScript yet
  // value() {
  //   return this.valueMethod(RSDistribution.getSymbolic);
  // }
}

export type SqDistribution =
  | SqPointSetDistribution
  | SqSampleSetDistribution
  | SqSymbolicDistribution;
