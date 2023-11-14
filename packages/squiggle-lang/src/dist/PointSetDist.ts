import * as Continuous from "../PointSet/Continuous.js";
import { ContinuousShape } from "../PointSet/Continuous.js";

import * as Mixed from "../PointSet/Mixed.js";
import { MixedShape } from "../PointSet/Mixed.js";

import * as Result from "../utility/result.js";

import * as PointSet from "../PointSet/PointSet.js";

import { createSparkline } from "../utility/sparklines.js";
import { BaseDist } from "./BaseDist.js";
import { DistError, sparklineError } from "./DistError.js";

export class PointSetDist extends BaseDist {
  pointSet: MixedShape;

  constructor(pointSet: MixedShape) {
    super();
    this.pointSet = pointSet;
  }

  override toString() {
    return "Point Set Distribution";
  }

  max() {
    return this.pointSet.maxX();
  }
  min() {
    return this.pointSet.minX();
  }
  mean() {
    return this.pointSet.mean();
  }
  variance(): Result.result<number, DistError> {
    return Result.Ok(this.pointSet.variance());
  }
  downsample(n: number): PointSetDist {
    return new PointSetDist(this.pointSet.downsample(n));
  }

  sample() {
    const randomItem = Math.random();
    return this.pointSet.integralYtoX(randomItem);
  }
  sampleN(n: number) {
    const items: number[] = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      items[i] = this.sample();
    }
    return items;
  }
  _isEqual(other: PointSetDist) {
    return this.pointSet.isEqual(other.pointSet);
  }

  truncate(
    left: number | undefined,
    right: number | undefined
  ): Result.result<PointSetDist, DistError> {
    if (left === undefined && right === undefined) {
      return Result.Ok(this);
    }

    return Result.Ok(
      new PointSetDist(this.pointSet.truncate(left, right).normalize())
    );
  }

  normalize() {
    return new PointSetDist(this.pointSet.normalize());
  }

  integralSum() {
    return this.pointSet.integralSum();
  }

  pdf(f: number): Result.result<number, DistError> {
    const mixedPoint = this.pointSet.xToY(f);
    return Result.Ok(mixedPoint.continuous + mixedPoint.discrete);
  }
  inv(f: number) {
    return this.pointSet.integralYtoX(f);
  }
  cdf(f: number) {
    return this.pointSet.integralXtoY(f);
  }

  toPointSetDist(): Result.result<PointSetDist, DistError> {
    // TODO: If env.xyPointLength is different from what it has, it should change.
    return Result.Ok(this);
  }

  toSparkline(bucketCount: number): Result.result<string, DistError> {
    const continuous = this.pointSet.toContinuous();
    if (!continuous) {
      return Result.Err(
        sparklineError("Cannot find the sparkline of a discrete distribution")
      );
    }
    const downsampled = continuous.downsampleEquallyOverX(bucketCount);
    return Result.Ok(createSparkline(downsampled.xyShape.ys));
  }

  // PointSet-only methods

  mapYResult<E>(
    fn: (y: number) => Result.result<number, E>,
    integralSumCacheFn: undefined | ((sum: number) => number | undefined),
    integralCacheFn:
      | undefined
      | ((cache: ContinuousShape) => ContinuousShape | undefined)
  ): Result.result<PointSetDist, E> {
    return Result.fmap(
      this.pointSet.mapYResult(fn, integralSumCacheFn, integralCacheFn),
      (pointSet) => new PointSetDist(pointSet)
    );
  }
}

//TODO WARNING: The combineAlgebraicallyWithDiscrete will break for subtraction and division, like, discrete - continous
export const combineAlgebraically = (
  op: PointSet.ConvolutionOperation,
  t1: PointSetDist,
  t2: PointSetDist
): PointSetDist => {
  return new PointSetDist(
    Mixed.combineAlgebraically(op, t1.pointSet, t2.pointSet)
  );
};

export const combinePointwise = <E>(
  t1: PointSetDist,
  t2: PointSetDist,
  fn: (v1: number, v2: number) => Result.result<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined,
  integralCachesFn: (
    s1: ContinuousShape,
    s2: ContinuousShape
  ) => ContinuousShape | undefined = () => undefined
): Result.result<PointSetDist, E> => {
  return Result.fmap(
    Mixed.combinePointwise(
      t1.pointSet,
      t2.pointSet,
      fn,
      integralSumCachesFn,
      integralCachesFn
    ),
    (pointSet) => new PointSetDist(pointSet)
  );
};

export function expectedConvolutionCost(d: PointSetDist): number {
  return (
    d.pointSet.toContinuous().xyShape.xs.length +
    d.pointSet.toDiscrete().xyShape.xs.length
  );
}
