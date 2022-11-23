import * as Continuous from "./Continuous";
import * as RSResult from "../rsResult";
import * as MixedPoint from "./MixedPoint";
import * as Common from "./Common";
import { ContinuousShape } from "./Continuous";
import * as XYShape from "../XYShape";
import {
  ConvolutionOperation,
  convolutionOperationToFn,
  PointSet,
} from "./types";
import { epsilon_float } from "../magicNumbers";
import { random_sample } from "../js/math";

export type DiscreteShape = {
  xyShape: XYShape.XYShape;
  integralSumCache?: number;
  integralCache?: Continuous.ContinuousShape;
};

export const make = (
  xyShape: XYShape.XYShape,
  integralSumCache: number | undefined = undefined,
  integralCache: ContinuousShape | undefined = undefined
): DiscreteShape => ({
  xyShape,
  integralSumCache,
  integralCache,
});

export const shapeMap = (
  t: DiscreteShape,
  fn: (shape: XYShape.XYShape) => XYShape.XYShape
): DiscreteShape => ({
  xyShape: fn(t.xyShape),
  integralSumCache: t.integralSumCache,
  integralCache: t.integralCache,
});

// let getShape = (t: t) => t.xyShape
// let oShapeMap = (fn, {xyShape, integralSumCache, integralCache}: t): option<t> =>
//   fn(xyShape)->E.O.fmap(make(~integralSumCache, ~integralCache))

const emptyIntegral: ContinuousShape = {
  xyShape: { xs: [-Infinity], ys: [0] },
  interpolation: "Stepwise",
  integralSumCache: 0,
  integralCache: undefined,
};

export const empty: DiscreteShape = {
  xyShape: XYShape.T.empty,
  integralSumCache: 0,
  integralCache: emptyIntegral,
};

// let shapeFn = (t: t, fn) => t->getShape->fn

// let lastY = (t: t) => t->getShape->XYShape.T.lastY

export const combinePointwise = <E>(
  t1: DiscreteShape,
  t2: DiscreteShape,
  fn: (v1: number, v2: number) => RSResult.rsResult<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined
): RSResult.rsResult<DiscreteShape, E> => {
  const combiner = XYShape.PointwiseCombination.combine;

  // const combinedIntegralSum = Common.combineIntegralSums(
  //   integralSumCachesFn,
  //   t1.integralSumCache,
  //   t2.integralSumCache
  // );

  // TODO: does it ever make sense to pointwise combine the integrals here?
  // It could be done for pointwise additions, but is that ever needed?

  return RSResult.fmap(
    combiner(XYShape.XtoY.discreteInterpolator, fn, t1.xyShape, t2.xyShape),
    (x) => make(x)
  );
};

export const reduce = <E>(
  shapes: DiscreteShape[],
  fn: (v1: number, v2: number) => RSResult.rsResult<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined
): RSResult.rsResult<DiscreteShape, E> => {
  let acc = empty;
  for (const shape of shapes) {
    const result = combinePointwise(acc, shape, fn, integralSumCachesFn);
    if (result.TAG === RSResult.E.Error) {
      return result;
    }
    acc = result._0;
  }
  return RSResult.Ok(acc);
};

export const updateIntegralSumCache = (
  t: DiscreteShape,
  integralSumCache: number | undefined
): DiscreteShape => {
  return {
    ...t,
    integralSumCache,
  };
};

export const updateIntegralCache = (
  t: DiscreteShape,
  integralCache: ContinuousShape | undefined
): DiscreteShape => {
  return {
    ...t,
    integralCache,
  };
};

/* This multiples all of the data points together and creates a new discrete distribution from the results.
 Data points at the same xs get added together. It may be a good idea to downsample t1 and t2 before and/or the result after. */
export const combineAlgebraically = (
  op: ConvolutionOperation,
  t1: DiscreteShape,
  t2: DiscreteShape
): DiscreteShape => {
  let t1s = t1.xyShape;
  let t2s = t2.xyShape;
  let t1n = XYShape.T.length(t1s);
  let t2n = XYShape.T.length(t2s);

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

  return make(combinedShape, combinedIntegralSum);
};

export const scaleBy = (t: DiscreteShape, scale: number): DiscreteShape => {
  return T.mapY(
    t,
    (r) => r * scale,
    (sum) => sum * scale,
    (cache) => Continuous.scaleBy(cache, scale)
  );
};

export const T: PointSet<DiscreteShape> = {
  integral(t) {
    if (XYShape.T.isEmpty(t.xyShape)) {
      return emptyIntegral;
    }
    if (t.integralCache) {
      return t.integralCache;
    }

    const ts = t.xyShape;
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

    return Continuous.make(integralShape, "Stepwise");
  },
  integralEndY(t) {
    return t.integralSumCache ?? Continuous.lastY(T.integral(t));
  },
  minX(t) {
    return XYShape.T.minX(t.xyShape);
  },
  maxX(t) {
    return XYShape.T.maxX(t.xyShape);
  },
  toDiscreteProbabilityMassFraction() {
    return 1;
  },
  mapY(t, fn, integralSumCacheFn, integralCacheFn) {
    return make(
      XYShape.T.mapY(t.xyShape, fn),
      t.integralSumCache === undefined
        ? undefined
        : integralSumCacheFn?.(t.integralSumCache),
      t.integralCache === undefined
        ? undefined
        : integralCacheFn?.(t.integralCache)
    );
  },

  mapYResult(t, fn, integralSumCacheFn, integralCacheFn) {
    const result = XYShape.T.mapYResult(t.xyShape, fn);
    if (result.TAG === RSResult.E.Ok) {
      return RSResult.Ok(
        make(
          result._0,
          t.integralSumCache === undefined
            ? undefined
            : integralSumCacheFn(t.integralSumCache),
          t.integralCache === undefined
            ? undefined
            : integralCacheFn(t.integralCache)
        )
      );
    } else {
      return result;
    }
  },

  updateIntegralCache,

  toContinuous() {
    return undefined;
  },
  toDiscrete(t) {
    return t;
  },

  normalize(t) {
    return updateIntegralSumCache(scaleBy(t, 1 / T.integralEndY(t)), 1);
  },

  downsample(i, t) {
    // It's not clear how to downsample a set of discrete points in a meaningful way.
    // The best we can do is to clip off the smallest values.
    const currentLength = XYShape.T.length(t.xyShape);

    if (i < currentLength && i >= 1 && currentLength > 1) {
      const sortedByY = XYShape.Zipped.sortByY(XYShape.T.zip(t.xyShape));
      const picked = [...sortedByY].reverse().slice(0, i);
      return make(XYShape.T.fromZippedArray(XYShape.Zipped.sortByX(picked)));
    } else {
      return t;
    }
  },

  truncate(leftCutoff, rightCutoff, t) {
    return make(
      XYShape.T.fromZippedArray(
        XYShape.Zipped.filterByX(
          XYShape.T.zip(t.xyShape),
          (x) =>
            x >= (leftCutoff ?? -Infinity) && x <= (rightCutoff ?? Infinity)
        )
      )
    );
  },

  xToY(f, t) {
    return MixedPoint.makeDiscrete(
      XYShape.XtoY.stepwiseIfAtX(t.xyShape, f) ?? 0
    );
  },

  integralXtoY(f, t) {
    return XYShape.XtoY.linear(T.integral(t).xyShape, f);
  },
  integralYtoX(f, t) {
    return XYShape.YtoX.linear(T.integral(t).xyShape, f);
  },

  mean(t: DiscreteShape): number {
    const s = t.xyShape;
    return s.xs.reduce((acc, x, i) => acc + x * s.ys[i], 0);
  },

  variance(t: DiscreteShape): number {
    const getMeanOfSquares = (t: DiscreteShape) =>
      T.mean(shapeMap(t, XYShape.T.square));

    return XYShape.Analysis.getVarianceDangerously(t, T.mean, getMeanOfSquares);
  },
};

export const sampleN = (t: DiscreteShape, n: number): number[] => {
  const normalized = T.normalize(t).xyShape;
  return random_sample(normalized.xs, { probs: normalized.ys, size: n });
};
