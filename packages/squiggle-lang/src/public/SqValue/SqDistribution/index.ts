import { BaseDist } from "../../../dists/BaseDist.js";
import { DistError } from "../../../dists/DistError.js";
import { Env } from "../../../dists/env.js";
import { PointSetDist } from "../../../dists/PointSetDist.js";
import { SampleSetDist } from "../../../dists/SampleSetDist/index.js";
import { BaseSymbolicDist } from "../../../dists/SymbolicDist/BaseSymbolicDist.js";
import { SymbolicDist } from "../../../dists/SymbolicDist/index.js";
import * as Result from "../../../utility/result.js";
import { Ok, result } from "../../../utility/result.js";
import { SqDistributionError } from "./SqDistributionError.js";
import { wrapPointSet } from "./SqPointSet.js";

export enum SqDistributionTag {
  PointSet = "PointSet",
  SampleSet = "SampleSet",
  Symbolic = "Symbolic",
}

export function wrapDistribution(value: BaseDist): SqDistribution {
  if (value instanceof BaseSymbolicDist) {
    return new SqSymbolicDistribution(value);
  } else if (value instanceof SampleSetDist) {
    return new SqSampleSetDistribution(value);
  } else if (value instanceof PointSetDist) {
    return new SqPointSetDistribution(value);
  }
  throw new Error(`Unknown value ${value}`);
}

export abstract class SqAbstractDistribution<T extends BaseDist> {
  abstract tag: SqDistributionTag;

  constructor(public _value: T) {}

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

  integralSum(): number {
    return this._value.integralSum();
  }

  isNormalized(): boolean {
    return this._value.isNormalized();
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
}

export class SqSampleSetDistribution extends SqAbstractDistribution<SampleSetDist> {
  tag = SqDistributionTag.SampleSet as const;

  getSamples(): readonly number[] {
    return this._value.samples;
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
