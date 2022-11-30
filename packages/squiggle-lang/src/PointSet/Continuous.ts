import { epsilon_float } from "../magicNumbers";
import * as XYShape from "../XYShape";
import * as MixedPoint from "./MixedPoint";
import * as Result from "../utility/result";
import { MixedShape } from "./Mixed";
import * as AlgebraicShapeCombination from "./AlgebraicShapeCombination";
import * as Common from "./Common";
import { ConvolutionOperation, DistributionType, PointSet } from "./PointSet";
import * as Discrete from "./Discrete";
import { DiscreteShape } from "./Discrete";

export class ContinuousShape implements PointSet<ContinuousShape> {
  readonly xyShape: XYShape.XYShape;
  readonly interpolation: XYShape.InterpolationStrategy;
  readonly integralSumCache?: number;
  readonly integralCache?: ContinuousShape;

  constructor(args: {
    xyShape: XYShape.XYShape;
    interpolation?: XYShape.InterpolationStrategy;
    integralSumCache?: number;
    integralCache?: ContinuousShape;
  }) {
    this.xyShape = args.xyShape;
    this.interpolation = args.interpolation ?? "Linear";
    this.integralSumCache = args.integralSumCache;
    this.integralCache = args.integralCache;
  }

  lastY() {
    return XYShape.T.lastY(this.xyShape);
  }

  minX() {
    return XYShape.T.minX(this.xyShape);
  }

  maxX() {
    return XYShape.T.maxX(this.xyShape);
  }

  mapY(
    fn: (y: number) => number,
    integralSumCacheFn?: ((sum: number) => number | undefined) | undefined,
    integralCacheFn?:
      | ((cache: ContinuousShape) => ContinuousShape | undefined)
      | undefined
  ): ContinuousShape {
    return new ContinuousShape({
      xyShape: XYShape.T.mapY(this.xyShape, fn),
      interpolation: this.interpolation,
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
  ): Result.result<ContinuousShape, E> {
    const result = XYShape.T.mapYResult(this.xyShape, fn);
    if (!result.ok) {
      return result;
    }
    return Result.Ok(
      new ContinuousShape({
        xyShape: result.value,
        interpolation: this.interpolation,
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
    integralCache: ContinuousShape | undefined
  ): ContinuousShape {
    return new ContinuousShape({
      xyShape: this.xyShape,
      interpolation: this.interpolation,
      integralSumCache: this.integralSumCache,
      integralCache,
    });
  }

  updateIntegralSumCache(
    integralSumCache: number | undefined
  ): ContinuousShape {
    return new ContinuousShape({
      xyShape: this.xyShape,
      interpolation: this.interpolation,
      integralSumCache,
      integralCache: this.integralCache,
    });
  }

  toDiscreteProbabilityMassFraction() {
    return 0;
  }

  xToY(f: number) {
    switch (this.interpolation) {
      case "Stepwise":
        return MixedPoint.makeContinuous(
          XYShape.XtoY.stepwiseIncremental(this.xyShape, f) ?? 0
        );
      case "Linear":
        return MixedPoint.makeContinuous(XYShape.XtoY.linear(this.xyShape, f));
    }
  }

  truncate(leftCutoff: number | undefined, rightCutoff: number | undefined) {
    const lc = leftCutoff ?? -Infinity;
    const rc = rightCutoff ?? Infinity;
    const truncatedZippedPairs = XYShape.Zipped.filterByX(
      XYShape.T.zip(this.xyShape),
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

    return new ContinuousShape({ xyShape: truncatedShape });
  }

  // TODO: This should work with stepwise plots.
  integral() {
    if (XYShape.T.isEmpty(this.xyShape)) {
      return emptyIntegral();
    }
    if (this.integralCache) {
      return this.integralCache;
    }
    return new ContinuousShape({
      xyShape: XYShape.Range.integrateWithTriangles(this.xyShape),
    });
  }

  private shapeMap(
    fn: (shape: XYShape.XYShape) => XYShape.XYShape
  ): ContinuousShape {
    return new ContinuousShape({
      xyShape: fn(this.xyShape),
      interpolation: this.interpolation,
      integralSumCache: this.integralSumCache,
      integralCache: this.integralCache,
    });
  }

  downsample(length: number) {
    return this.shapeMap((shape) =>
      XYShape.XsConversion.proportionByProbabilityMass(
        shape,
        length,
        this.integral().xyShape
      )
    );
  }

  integralEndY() {
    return this.integralSumCache ?? this.integral().lastY();
  }

  integralXtoY(f: number) {
    return XYShape.XtoY.linear(this.integral().xyShape, f);
  }
  integralYtoX(f: number) {
    return XYShape.YtoX.linear(this.integral().xyShape, f);
  }
  toContinuous() {
    return this;
  }
  toDiscrete() {
    return undefined;
  }
  toMixed() {
    return new MixedShape({
      continuous: this,
      discrete: Discrete.empty(),
      integralSumCache: this.integralSumCache,
      integralCache: this.integralCache,
    });
  }

  scaleBy(scale: number): ContinuousShape {
    return this.mapY(
      (r) => r * scale,
      (sum) => sum * scale,
      (cache) => cache.scaleBy(scale)
    );
  }

  normalize() {
    return this.updateIntegralCache(this.integral())
      .scaleBy(1 / this.integralEndY())
      .updateIntegralSumCache(1);
  }

  mean() {
    const indefiniteIntegralStepwise = (p: number, h1: number) =>
      (h1 * p ** 2) / 2;
    const indefiniteIntegralLinear = (p: number, a: number, b: number) =>
      (a * p ** 2) / 2 + (b * p ** 3) / 3;

    return this.integrate(indefiniteIntegralStepwise, indefiniteIntegralLinear);
  }

  private integrate(
    indefiniteIntegralStepwise = (p: number, h1: number) => h1 * p,
    indefiniteIntegralLinear = (p: number, a: number, b: number) =>
      a * p + (b * p ** 2) / 2
  ): number {
    const xs = this.xyShape.xs;
    const ys = this.xyShape.ys;
    let areaUnderIntegral = 0;
    for (let i = 1; i < xs.length; i++) {
      // TODO Take this if statement out of the loop body?
      if (this.interpolation === "Stepwise") {
        areaUnderIntegral +=
          indefiniteIntegralStepwise(xs[i], ys[i - 1]) -
          indefiniteIntegralStepwise(xs[i - 1], ys[i - 1]);
      } else if (this.interpolation === "Linear") {
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
        throw new Error(`Unknown interpolation strategy ${this.interpolation}`);
      }
    }
    return areaUnderIntegral;
  }

  getMeanOfSquares(): number {
    const indefiniteIntegralLinear = (p: number, a: number, b: number) =>
      (a * p ** 3) / 3 + (b * p ** 4) / 4;
    const indefiniteIntegralStepwise = (p: number, h1: number) =>
      (h1 * p ** 3) / 3;
    return this.integrate(indefiniteIntegralStepwise, indefiniteIntegralLinear);
  }

  variance() {
    return XYShape.Analysis.getVarianceDangerously(
      this,
      (t) => t.mean(),
      (t) => t.getMeanOfSquares()
    );
  }

  downsampleEquallyOverX(length: number): ContinuousShape {
    return this.shapeMap((shape) =>
      XYShape.XsConversion.proportionEquallyOverX(shape, length)
    );
  }
}

export const Analysis = {};

const emptyIntegral = () =>
  new ContinuousShape({
    xyShape: {
      xs: [-Infinity],
      ys: [0.0],
    },
    interpolation: "Linear",
    integralSumCache: 0,
    integralCache: undefined,
  });

export const empty = () =>
  new ContinuousShape({
    xyShape: XYShape.T.empty,
    interpolation: "Linear",
    integralSumCache: 0,
    integralCache: emptyIntegral(),
  });

export const stepwiseToLinear = (t: ContinuousShape): ContinuousShape => {
  return new ContinuousShape({
    xyShape: XYShape.Range.stepwiseToLinear(t.xyShape),
    interpolation: "Linear",
    integralSumCache: t.integralSumCache,
    integralCache: t.integralCache,
  });
};

// Note: This results in a distribution with as many points as the sum of those in t1 and t2.
export const combinePointwise = <E>(
  t1: ContinuousShape,
  t2: ContinuousShape,
  fn: (v1: number, v2: number) => Result.result<number, E>,
  distributionType: DistributionType = "PDF",
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined
): Result.result<ContinuousShape, E> => {
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

  return Result.fmap(
    combiner(interpolator, fn, t1.xyShape, t2.xyShape),
    (x) =>
      new ContinuousShape({
        xyShape: x,
        interpolation: "Linear",
        integralSumCache: combinedIntegralSum,
      })
  );
};

export const getShape = (t: ContinuousShape) => t.xyShape;

export const sum = (continuousShapes: ContinuousShape[]): ContinuousShape => {
  return continuousShapes.reduce((x, y) => {
    const result = combinePointwise(x, y, (a, b) => Result.Ok(a + b));
    if (!result.ok) {
      throw new Error("Addition should never fail");
    }
    return result.value;
  }, empty());
};

export const reduce = <E>(
  continuousShapes: ContinuousShape[],
  fn: (v1: number, v2: number) => Result.result<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined
): Result.result<ContinuousShape, E> => {
  let acc = empty();
  for (const shape of continuousShapes) {
    const result = combinePointwise(
      acc,
      shape,
      fn,
      undefined,
      integralSumCachesFn
    );
    if (!result.ok) {
      return result;
    }
    acc = result.value;
  }
  return Result.Ok(acc);
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
    return empty();
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
    return new ContinuousShape({
      xyShape: combinedShape,
      interpolation: t1.interpolation,
      integralSumCache: combinedIntegralSum,
    });
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
    return empty();
  } else {
    const combinedShape =
      AlgebraicShapeCombination.combineShapesContinuousContinuous(op, s1, s2);
    const combinedIntegralSum = Common.combineIntegralSums(
      (a, b) => a * b,
      t1.integralSumCache,
      t2.integralSumCache
    );
    // return a new Continuous distribution
    return new ContinuousShape({
      xyShape: combinedShape,
      interpolation: "Linear",
      integralSumCache: combinedIntegralSum,
    });
  }
};
