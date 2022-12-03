import * as Continuous from "../PointSet/Continuous";
import { ContinuousShape } from "../PointSet/Continuous";

import { MixedShape } from "../PointSet/Mixed";

import * as magicNumbers from "../magicNumbers";
import * as Result from "../utility/result";

import * as PointSet from "../PointSet/PointSet";

import { BaseDist } from "./BaseDist";
import { AnyPointSet } from "../PointSet/PointSet";
import { DistError, sparklineError } from "./DistError";
import { createSparkline } from "../utility/sparklines";

export class PointSetDist<
  T extends AnyPointSet = AnyPointSet
> extends BaseDist {
  pointSet: T;

  constructor(pointSet: T) {
    super();
    this.pointSet = pointSet;
  }

  toString() {
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

  private samplePointSet(pointSet: AnyPointSet) {
    const randomItem = Math.random();
    return pointSet.integralYtoX(randomItem);
  }
  sample() {
    return this.samplePointSet(this.pointSet);
  }
  sampleN(n: number) {
    const integralCache = this.pointSet.integral();
    const distWithUpdatedIntegralCache =
      this.pointSet.updateIntegralCache(integralCache);
    const items: number[] = new Array(n).fill(0);
    for (let i = 0; i <= n - 1; i++) {
      items[i] = this.samplePointSet(distWithUpdatedIntegralCache);
    }
    return items;
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

  integralEndY() {
    return this.pointSet.integralEndY();
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
      return Result.Error(
        sparklineError("Cannot find the sparkline of a discrete distribution")
      );
    }
    const downsampled = continuous.downsampleEquallyOverX(bucketCount);
    return Result.Ok(createSparkline(Continuous.getShape(downsampled).ys));
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
      this.pointSet.mapYResult(
        fn,
        integralSumCacheFn,
        integralCacheFn
      ) as Result.result<AnyPointSet, E>,
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
    PointSet.combineAlgebraically(op, t1.pointSet, t2.pointSet)
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
    PointSet.combinePointwise(
      t1.pointSet,
      t2.pointSet,
      fn,
      integralSumCachesFn,
      integralCachesFn
    ),
    (pointSet) => new PointSetDist(pointSet)
  );
};

export const expectedConvolutionCost = (d: PointSetDist): number => {
  if (PointSet.isContinuous(d.pointSet)) {
    return magicNumbers.OpCost.continuousCost;
  } else if (PointSet.isDiscrete(d.pointSet)) {
    return d.pointSet.xyShape.xs.length;
  } else if (d.pointSet instanceof MixedShape) {
    return magicNumbers.OpCost.mixedCost;
  }
  throw new Error(`Unknown PointSet ${d}`);
};
