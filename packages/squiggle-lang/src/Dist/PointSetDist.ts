import * as Continuous from "../PointSet/Continuous";
import { ContinuousShape } from "../PointSet/Continuous";

import { MixedShape } from "../PointSet/Mixed";

import * as magicNumbers from "../magicNumbers";
import * as RSResult from "../rsResult";
import * as Sparklines from "../Sparklines";

import * as PointSet from "../PointSet/PointSet";

import { BaseDist } from "./Base";
import { AnyPointSet } from "../PointSet/PointSet";

export class PointSetDist<
  T extends AnyPointSet = AnyPointSet
> extends BaseDist {
  pointSet: T;

  constructor(pointSet: T) {
    super();
    this.pointSet = pointSet;
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

  truncate(left: number, right: number) {
    return new PointSetDist(this.pointSet.truncate(left, right));
  }

  normalize() {
    return new PointSetDist(this.pointSet.normalize());
  }

  integralEndY() {
    return this.pointSet.integralEndY();
  }

  pdf(f: number) {
    const mixedPoint = this.pointSet.xToY(f);
    return mixedPoint.continuous + mixedPoint.discrete;
  }
  inv(f: number) {
    return this.pointSet.integralYtoX(f);
  }
  cdf(f: number) {
    return this.pointSet.integralXtoY(f);
  }

  // PointSet-only methods
  toSparkline(bucketCount: number): RSResult.rsResult<string, string> {
    const continuous = this.pointSet.toContinuous();
    if (!continuous) {
      return RSResult.Error(
        "Cannot find the sparkline of a discrete distribution"
      );
    }
    const downsampled = continuous.downsampleEquallyOverX(bucketCount);
    return RSResult.Ok(Sparklines.create(Continuous.getShape(downsampled).ys));
  }

  mapYResult<E>(
    fn: (y: number) => RSResult.rsResult<number, E>,
    integralSumCacheFn: undefined | ((sum: number) => number | undefined),
    integralCacheFn:
      | undefined
      | ((cache: ContinuousShape) => ContinuousShape | undefined)
  ): RSResult.rsResult<PointSetDist, E> {
    return RSResult.fmap(
      this.pointSet.mapYResult(
        fn,
        integralSumCacheFn,
        integralCacheFn
      ) as RSResult.rsResult<AnyPointSet, E>,
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
  fn: (v1: number, v2: number) => RSResult.rsResult<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined,
  integralCachesFn: (
    s1: ContinuousShape,
    s2: ContinuousShape
  ) => ContinuousShape | undefined = () => undefined
): RSResult.rsResult<PointSetDist, E> => {
  return RSResult.fmap(
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

// let isFloat = (t: t) =>
//   switch t {
//   | Discrete(d) => Discrete.isFloat(d)
//   | _ => false
//   }

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
