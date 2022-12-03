import * as Continuous from "./Continuous";
import * as Result from "../utility/result";
import * as MixedPoint from "./MixedPoint";
import * as Common from "./Common";
import { ContinuousShape } from "./Continuous";
import * as XYShape from "../XYShape";
import {
  ConvolutionOperation,
  convolutionOperationToFn,
  PointSet,
} from "./PointSet";
import { epsilon_float } from "../magicNumbers";
import { random_sample } from "../utility/math";
import { MixedShape } from "./Mixed";

export class DiscreteShape implements PointSet<DiscreteShape> {
  readonly xyShape: XYShape.XYShape;
  readonly integralSumCache?: number;
  readonly integralCache?: Continuous.ContinuousShape;

  constructor(args: {
    xyShape: XYShape.XYShape;
    integralSumCache?: number;
    integralCache?: ContinuousShape;
  }) {
    this.xyShape = args.xyShape;
    this.integralSumCache = args.integralSumCache;
    this.integralCache = args.integralCache;
  }

  shapeMap(fn: (shape: XYShape.XYShape) => XYShape.XYShape): DiscreteShape {
    return new DiscreteShape({
      xyShape: fn(this.xyShape),
      integralSumCache: this.integralSumCache,
      integralCache: this.integralCache,
    });
  }

  integral() {
    if (XYShape.T.isEmpty(this.xyShape)) {
      return emptyIntegral();
    }
    if (this.integralCache) {
      return this.integralCache;
    }

    const ts = this.xyShape;
    // The first xy of this integral should always be the zero, to ensure nice plotting
    const firstX = XYShape.T.minX(ts);
    const prependedZeroPoint: XYShape.XYShape = {
      xs: [firstX - epsilon_float],
      ys: [0],
    };
    const integralShape = XYShape.T.accumulateYs(
      XYShape.T.concat(prependedZeroPoint, ts),
      (a, b) => a + b
    );

    return new ContinuousShape({
      xyShape: integralShape,
      interpolation: "Stepwise",
    });
  }

  integralEndY() {
    return this.integralSumCache ?? this.integral().lastY();
  }

  minX() {
    return XYShape.T.minX(this.xyShape);
  }
  maxX() {
    return XYShape.T.maxX(this.xyShape);
  }
  toDiscreteProbabilityMassFraction() {
    return 1;
  }

  mapY(
    fn: (y: number) => number,
    integralSumCacheFn?: ((sum: number) => number | undefined) | undefined,
    integralCacheFn?:
      | ((
          cache: Continuous.ContinuousShape
        ) => Continuous.ContinuousShape | undefined)
      | undefined
  ) {
    return new DiscreteShape({
      xyShape: XYShape.T.mapY(this.xyShape, fn),
      integralSumCache:
        this.integralSumCache === undefined
          ? undefined
          : integralSumCacheFn?.(this.integralSumCache),
      integralCache:
        this.integralCache === undefined
          ? undefined
          : integralCacheFn?.(this.integralCache),
    });
  }

  mapYResult<E>(
    fn: (y: number) => Result.result<number, E>,
    integralSumCacheFn: ((sum: number) => number | undefined) | undefined,
    integralCacheFn:
      | ((cache: ContinuousShape) => ContinuousShape | undefined)
      | undefined
  ): Result.result<DiscreteShape, E> {
    const result = XYShape.T.mapYResult(this.xyShape, fn);
    if (!result.ok) {
      return result;
    }
    return Result.Ok(
      new DiscreteShape({
        xyShape: result.value,
        integralSumCache:
          this.integralSumCache === undefined
            ? undefined
            : integralSumCacheFn?.(this.integralSumCache),
        integralCache:
          this.integralCache === undefined
            ? undefined
            : integralCacheFn?.(this.integralCache),
      })
    );
  }

  updateIntegralCache(
    integralCache: Continuous.ContinuousShape | undefined
  ): DiscreteShape {
    return new DiscreteShape({
      xyShape: this.xyShape,
      integralSumCache: this.integralSumCache,
      integralCache,
    });
  }

  updateIntegralSumCache(integralSumCache: number | undefined): DiscreteShape {
    return new DiscreteShape({
      xyShape: this.xyShape,
      integralSumCache,
      integralCache: this.integralCache,
    });
  }

  toContinuous() {
    return undefined;
  }
  toDiscrete() {
    return this;
  }
  toMixed() {
    return new MixedShape({
      continuous: Continuous.empty(),
      discrete: this,
      integralSumCache: this.integralSumCache,
      integralCache: this.integralCache,
    });
  }

  scaleBy(scale: number): DiscreteShape {
    return this.mapY(
      (r) => r * scale,
      (sum) => sum * scale,
      (cache) => cache.scaleBy(scale)
    );
  }

  normalize() {
    return this.scaleBy(1 / this.integralEndY()).updateIntegralSumCache(1);
  }

  downsample(i: number) {
    // It's not clear how to downsample a set of discrete points in a meaningful way.
    // The best we can do is to clip off the smallest values.
    const currentLength = XYShape.T.length(this.xyShape);

    if (i < currentLength && i >= 1 && currentLength > 1) {
      const sortedByY = XYShape.Zipped.sortByY(XYShape.T.zip(this.xyShape));
      const picked = [...sortedByY].reverse().slice(0, i);
      return new DiscreteShape({
        xyShape: XYShape.T.fromZippedArray(XYShape.Zipped.sortByX(picked)),
      });
    } else {
      return this;
    }
  }

  truncate(leftCutoff: number | undefined, rightCutoff: number | undefined) {
    return new DiscreteShape({
      xyShape: XYShape.T.fromZippedArray(
        XYShape.Zipped.filterByX(
          XYShape.T.zip(this.xyShape),
          (x) =>
            x >= (leftCutoff ?? -Infinity) && x <= (rightCutoff ?? Infinity)
        )
      ),
    });
  }

  xToY(f: number) {
    return MixedPoint.makeDiscrete(
      XYShape.XtoY.stepwiseIfAtX(this.xyShape, f) ?? 0
    );
  }

  integralXtoY(f: number) {
    return XYShape.XtoY.linear(this.integral().xyShape, f);
  }
  integralYtoX(f: number) {
    return XYShape.YtoX.linear(this.integral().xyShape, f);
  }

  mean() {
    const s = this.xyShape;
    return s.xs.reduce((acc, x, i) => acc + x * s.ys[i], 0);
  }

  variance() {
    return XYShape.Analysis.getVarianceDangerously(
      this,
      (t) => t.mean(),
      (t) => t.shapeMap(XYShape.T.square).mean()
    );
  }
}

const emptyIntegral = () =>
  new ContinuousShape({
    xyShape: { xs: [-Infinity], ys: [0] },
    interpolation: "Stepwise",
    integralSumCache: 0,
    integralCache: undefined,
  });

export const empty = () =>
  new DiscreteShape({
    xyShape: XYShape.T.empty,
    integralSumCache: 0,
    integralCache: emptyIntegral(),
  });

// unused
export const isFloat = (t: DiscreteShape): boolean => {
  if (t.xyShape.ys.length === 1 && t.xyShape.ys[0] === 1) {
    return true;
  }
  return false;
};

export const getShape = (t: DiscreteShape) => t.xyShape;

export const combinePointwise = <E>(
  t1: DiscreteShape,
  t2: DiscreteShape,
  fn: (v1: number, v2: number) => Result.result<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined
): Result.result<DiscreteShape, E> => {
  const combiner = XYShape.PointwiseCombination.combine;

  // const combinedIntegralSum = Common.combineIntegralSums(
  //   integralSumCachesFn,
  //   t1.integralSumCache,
  //   t2.integralSumCache
  // );

  // TODO: does it ever make sense to pointwise combine the integrals here?
  // It could be done for pointwise additions, but is that ever needed?

  return Result.fmap(
    combiner(XYShape.XtoY.discreteInterpolator, fn, t1.xyShape, t2.xyShape),
    (x) => new DiscreteShape({ xyShape: x })
  );
};

export const reduce = <E>(
  shapes: DiscreteShape[],
  fn: (v1: number, v2: number) => Result.result<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined
): Result.result<DiscreteShape, E> => {
  let acc = empty();
  for (const shape of shapes) {
    const result = combinePointwise(acc, shape, fn, integralSumCachesFn);
    if (!result.ok) {
      return result;
    }
    acc = result.value;
  }
  return Result.Ok(acc);
};

/* This multiples all of the data points together and creates a new discrete distribution from the results.
 Data points at the same xs get added together. It may be a good idea to downsample t1 and t2 before and/or the result after. */
export const combineAlgebraically = (
  op: ConvolutionOperation,
  t1: DiscreteShape,
  t2: DiscreteShape
): DiscreteShape => {
  const t1s = t1.xyShape;
  const t2s = t2.xyShape;
  const t1n = XYShape.T.length(t1s);
  const t2n = XYShape.T.length(t2s);

  const combinedIntegralSum = Common.combineIntegralSums(
    (s1, s2) => s1 * s2,
    t1.integralSumCache,
    t2.integralSumCache
  );

  const fn = convolutionOperationToFn(op);
  const xToYMap = new Map<number, number>();

  for (let i = 0; i <= t1n - 1; i++) {
    for (let j = 0; j <= t2n - 1; j++) {
      const x = fn(t1s.xs[i], t2s.xs[j]);
      const cv = xToYMap.get(x) ?? 0;
      const my = t1s.ys[i] * t2s.ys[j];
      xToYMap.set(x, cv + my);
    }
  }

  const rxys = XYShape.Zipped.sortByX([...xToYMap.entries()]);

  const combinedShape = XYShape.T.fromZippedArray(rxys);

  return new DiscreteShape({
    xyShape: combinedShape,
    integralSumCache: combinedIntegralSum,
  });
};

export const sampleN = (t: DiscreteShape, n: number): number[] => {
  const normalized = t.normalize().xyShape;
  return random_sample(normalized.xs, { probs: normalized.ys, size: n });
};
