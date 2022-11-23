import { epsilon_float } from "../magicNumbers";
import * as XYShape from "../XYShape";
import * as MixedPoint from "./MixedPoint";
import * as RSResult from "../rsResult";
import * as Mixed from "./Mixed";
import * as AlgebraicShapeCombination from "./AlgebraicShapeCombination";
import * as Common from "./Common";
import { ConvolutionOperation, DistributionType, PointSet } from "./types";
import * as Discrete from "./Discrete";
import { DiscreteShape } from "./Discrete";

export type ContinuousShape = {
  xyShape: XYShape.XYShape;
  interpolation: XYShape.InterpolationStrategy;
  integralSumCache?: number;
  integralCache?: ContinuousShape;
};

export const Analysis = {
  integrate(
    t: ContinuousShape,
    indefiniteIntegralStepwise = (p: number, h1: number) => h1 * p,
    indefiniteIntegralLinear = (p: number, a: number, b: number) =>
      a * p + (b * p ** 2) / 2
  ): number {
    const xs = t.xyShape.xs;
    const ys = t.xyShape.ys;
    let areaUnderIntegral = 0;
    for (let i = 1; i < xs.length; i++) {
      // TODO Take this if statement out of the loop body?
      if (t.interpolation === "Stepwise") {
        areaUnderIntegral +=
          indefiniteIntegralStepwise(xs[i], ys[i - 1]) -
          indefiniteIntegralStepwise(xs[i - 1], ys[i - 1]);
      } else if (t.interpolation === "Linear") {
        const x1 = xs[i - 1];
        const x2 = xs[i];
        if (x1 !== x2) {
          const h1 = ys[i - 1];
          const h2 = ys[i];
          const b = (h1 - h2) / (x1 - x2);
          const a = h1 - b * x1;
          areaUnderIntegral +=
            indefiniteIntegralLinear(x2, a, b) -
            indefiniteIntegralLinear(x1, a, b);
        }
      } else {
        throw new Error(`Unknown interpolation strategy ${t.interpolation}`);
      }
    }
    return areaUnderIntegral;
  },

  getMeanOfSquares(t: ContinuousShape): number {
    const indefiniteIntegralLinear = (p: number, a: number, b: number) =>
      (a * p ** 3) / 3 + (b * p ** 4) / 4;
    const indefiniteIntegralStepwise = (p: number, h1: number) =>
      (h1 * p ** 3) / 3;
    return Analysis.integrate(
      t,
      indefiniteIntegralStepwise,
      indefiniteIntegralLinear
    );
  },
};

export const make = (
  xyShape: XYShape.XYShape,
  interpolation: XYShape.InterpolationStrategy = "Linear",
  integralSumCache: number | undefined = undefined,
  integralCache: ContinuousShape | undefined = undefined
): ContinuousShape => {
  return {
    xyShape,
    interpolation,
    integralSumCache,
    integralCache,
  };
};

const shapeMap = (
  t: ContinuousShape,
  fn: (shape: XYShape.XYShape) => XYShape.XYShape
): ContinuousShape => ({
  xyShape: fn(t.xyShape),
  interpolation: t.interpolation,
  integralSumCache: t.integralSumCache,
  integralCache: t.integralCache,
});

export const lastY = (t: ContinuousShape) => {
  return XYShape.T.lastY(t.xyShape);
};

// let oShapeMap = (fn, {xyShape, interpolation, integralSumCache, integralCache}: t): option<
//   PointSetTypes.continuousShape,
// > => fn(xyShape)->E.O.fmap(make(~interpolation, ~integralSumCache, ~integralCache))

const emptyIntegral: ContinuousShape = {
  xyShape: {
    xs: [-Infinity],
    ys: [0.0],
  },
  interpolation: "Linear",
  integralSumCache: 0,
  integralCache: undefined,
};
export const empty: ContinuousShape = {
  xyShape: XYShape.T.empty,
  interpolation: "Linear",
  integralSumCache: 0,
  integralCache: emptyIntegral,
};

export const stepwiseToLinear = (t: ContinuousShape): ContinuousShape => {
  return make(
    XYShape.Range.stepwiseToLinear(t.xyShape),
    "Linear",
    t.integralSumCache,
    t.integralCache
  );
};

// Note: This results in a distribution with as many points as the sum of those in t1 and t2.
export const combinePointwise = <E>(
  t1: ContinuousShape,
  t2: ContinuousShape,
  fn: (v1: number, v2: number) => RSResult.rsResult<number, E>,
  distributionType: DistributionType = "PDF",
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined
): RSResult.rsResult<ContinuousShape, E> => {
  const combiner = XYShape.PointwiseCombination.combine;
  // If we're adding the distributions, and we know the total of each, then we
  // can just sum them up. Otherwise, all bets are off.
  const combinedIntegralSum = Common.combineIntegralSums(
    integralSumCachesFn,
    t1.integralSumCache,
    t2.integralSumCache
  );

  // TODO: does it ever make sense to pointwise combine the integrals here?
  // It could be done for pointwise additions, but is that ever needed?

  // If combining stepwise and linear, we must convert the stepwise to linear first,
  // i.e. add a point at the bottom of each step
  if (t1.interpolation === "Stepwise" && t2.interpolation === "Linear") {
    t1 = stepwiseToLinear(t1);
  } else if (t1.interpolation === "Linear" && t2.interpolation === "Stepwise") {
    t2 = stepwiseToLinear(t2);
  }

  const extrapolation = {
    PDF: "UseZero" as const,
    CDF: "UseOutermostPoints" as const,
  }[distributionType];

  const interpolator = XYShape.XtoY.continuousInterpolator(
    t1.interpolation,
    extrapolation
  );

  return RSResult.fmap(
    combiner(interpolator, fn, t1.xyShape, t2.xyShape),
    (x) => make(x, "Linear", combinedIntegralSum)
  );
};

export const getShape = (t: ContinuousShape) => t.xyShape;

export const updateIntegralSumCache = (
  t: ContinuousShape,
  integralSumCache: number | undefined
): ContinuousShape => {
  return {
    ...t,
    integralSumCache,
  };
};

const updateIntegralCache = (
  t: ContinuousShape,
  integralCache: ContinuousShape | undefined
): ContinuousShape => {
  return {
    ...t,
    integralCache,
  };
};

export const sum = (continuousShapes: ContinuousShape[]): ContinuousShape => {
  return continuousShapes.reduce((x, y) => {
    const result = combinePointwise(x, y, (a, b) => RSResult.Ok(a + b));
    if (result.TAG === RSResult.E.Error) {
      throw new Error("Addition should never fail");
    }
    return result._0;
  }, empty);
};

export const reduce = <E>(
  continuousShapes: ContinuousShape[],
  fn: (v1: number, v2: number) => RSResult.rsResult<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined
): RSResult.rsResult<ContinuousShape, E> => {
  let acc = empty;
  for (const shape of continuousShapes) {
    const result = combinePointwise(
      acc,
      shape,
      fn,
      undefined,
      integralSumCachesFn
    );
    if (result.TAG === RSResult.E.Error) {
      return result;
    }
    acc = result._0;
  }
  return RSResult.Ok(acc);
};

export const scaleBy = (t: ContinuousShape, scale: number): ContinuousShape => {
  return T.mapY(
    t,
    (r) => r * scale,
    (sum) => sum * scale,
    (cache) => scaleBy(cache, scale)
  );
};

export const T: PointSet<ContinuousShape> = {
  minX(t: ContinuousShape) {
    return XYShape.T.minX(t.xyShape);
  },
  maxX(t: ContinuousShape) {
    return XYShape.T.maxX(t.xyShape);
  },
  mapY(t, fn, integralSumCacheFn, integralCacheFn) {
    return make(
      XYShape.T.mapY(t.xyShape, fn),
      t.interpolation,
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
          t.interpolation,
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

  toDiscreteProbabilityMassFraction(t) {
    return 0;
  },
  //   let toPointSetDist = (t: t): PointSetTypes.pointSetDist => Continuous(t)
  xToY(f, { interpolation, xyShape }) {
    switch (interpolation) {
      case "Stepwise":
        return MixedPoint.makeContinuous(
          XYShape.XtoY.stepwiseIncremental(xyShape, f) ?? 0
        );
      case "Linear":
        return MixedPoint.makeContinuous(XYShape.XtoY.linear(xyShape, f));
    }
  },

  truncate(leftCutoff, rightCutoff, t) {
    const lc = leftCutoff ?? -Infinity;
    const rc = rightCutoff ?? Infinity;
    const truncatedZippedPairs = XYShape.Zipped.filterByX(
      XYShape.T.zip(t.xyShape),
      (x) => x >= lc && x <= rc
    );

    const leftNewPoint: [number, number][] =
      leftCutoff === undefined ? [] : [[lc - epsilon_float, 0]];
    const rightNewPoint: [number, number][] =
      rightCutoff === undefined ? [] : [[rc + epsilon_float, 0]];

    const truncatedZippedPairsWithNewPoints = [
      ...leftNewPoint,
      ...truncatedZippedPairs,
      ...rightNewPoint,
    ];
    const truncatedShape = XYShape.T.fromZippedArray(
      truncatedZippedPairsWithNewPoints
    );

    return make(truncatedShape);
  },

  // TODO: This should work with stepwise plots.
  integral(t) {
    if (XYShape.T.isEmpty(t.xyShape)) {
      return emptyIntegral;
    }
    if (t.integralCache) {
      return t.integralCache;
    }
    return make(XYShape.Range.integrateWithTriangles(t.xyShape));
  },

  downsample(length, t) {
    return shapeMap(t, (shape) =>
      XYShape.XsConversion.proportionByProbabilityMass(
        shape,
        length,
        T.integral(t).xyShape
      )
    );
  },

  integralEndY(t) {
    return t.integralSumCache ?? lastY(T.integral(t));
  },
  integralXtoY(f, t) {
    return XYShape.XtoY.linear(T.integral(t).xyShape, f);
  },
  integralYtoX(f, t) {
    return XYShape.YtoX.linear(T.integral(t).xyShape, f);
  },
  toContinuous(t) {
    return t;
  },
  toDiscrete() {
    return undefined;
  },
  toMixed(t) {
    return Mixed.make(t, Discrete.empty, t.integralSumCache, t.integralCache);
  },

  normalize(t) {
    return updateIntegralSumCache(
      scaleBy(T.updateIntegralCache(t, T.integral(t)), 1 / T.integralEndY(t)),
      1
    );
  },

  mean(t: ContinuousShape) {
    const indefiniteIntegralStepwise = (p: number, h1: number) =>
      (h1 * p ** 2) / 2;
    const indefiniteIntegralLinear = (p: number, a: number, b: number) =>
      (a * p ** 2) / 2 + (b * p ** 3) / 3;

    return Analysis.integrate(
      t,
      indefiniteIntegralStepwise,
      indefiniteIntegralLinear
    );
  },
  variance(t: ContinuousShape): number {
    return XYShape.Analysis.getVarianceDangerously(
      t,
      T.mean,
      Analysis.getMeanOfSquares
    );
  },
};

// let isNormalized = (t: t): bool => {
//   let areaUnderIntegral = t->updateIntegralCache(Some(T.integral(t)))->T.integralEndY
//   areaUnderIntegral < 1. +. MagicNumbers.Epsilon.seven &&
//     areaUnderIntegral > 1. -. MagicNumbers.Epsilon.seven
// }

export let downsampleEquallyOverX = (
  length: number,
  t: ContinuousShape
): ContinuousShape => {
  return shapeMap(t, (shape) =>
    XYShape.XsConversion.proportionEquallyOverX(shape, length)
  );
};

/* This simply creates multiple copies of the continuous distribution, scaled and shifted according to
 each discrete data point, and then adds them all together. */
export const combineAlgebraicallyWithDiscrete = (
  op: ConvolutionOperation,
  t1: ContinuousShape,
  t2: DiscreteShape,
  discretePosition: AlgebraicShapeCombination.ArgumentPosition
): ContinuousShape => {
  let t1s = t1.xyShape;
  let t2s = t2.xyShape;

  if (XYShape.T.isEmpty(t1s) || XYShape.T.isEmpty(t2s)) {
    return empty;
  } else {
    const continuousAsLinear = {
      Linear: t1,
      Stepwise: stepwiseToLinear(t1),
    }[t1.interpolation];

    const combinedShape =
      AlgebraicShapeCombination.combineShapesContinuousDiscrete(
        op,
        continuousAsLinear.xyShape,
        t2s,
        { discretePosition }
      );

    const combinedIntegralSum =
      op === "Multiply"
        ? Common.combineIntegralSums(
            (a, b) => a * b,
            t1.integralSumCache,
            t2.integralSumCache
          )
        : undefined;

    // TODO: It could make sense to automatically transform the integrals here (shift or scale)
    return make(combinedShape, t1.interpolation, combinedIntegralSum);
  }
};

export const combineAlgebraically = (
  op: ConvolutionOperation,
  t1: ContinuousShape,
  t2: ContinuousShape
): ContinuousShape => {
  const s1 = t1.xyShape;
  const s2 = t2.xyShape;
  const t1n = XYShape.T.length(s1);
  const t2n = XYShape.T.length(s2);
  if (t1n === 0 || t2n === 0) {
    return empty;
  } else {
    const combinedShape =
      AlgebraicShapeCombination.combineShapesContinuousContinuous(op, s1, s2);
    const combinedIntegralSum = Common.combineIntegralSums(
      (a, b) => a * b,
      t1.integralSumCache,
      t2.integralSumCache
    );
    // return a new Continuous distribution
    return make(combinedShape, "Linear", combinedIntegralSum);
  }
};
