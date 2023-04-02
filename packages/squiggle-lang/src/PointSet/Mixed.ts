import * as XYShape from "../XYShape.js";
import * as Continuous from "./Continuous.js";
import * as Discrete from "./Discrete.js";
import * as MixedPoint from "./MixedPoint.js";
import * as Result from "../utility/result.js";
import * as Common from "./Common.js";
import { AnyPointSet } from "./PointSet.js";
import { ContinuousShape } from "./Continuous.js";
import { DiscreteShape } from "./Discrete.js";
import { ConvolutionOperation, PointSet } from "./PointSet.js";

export class MixedShape implements PointSet<MixedShape> {
  readonly continuous: ContinuousShape;
  readonly discrete: DiscreteShape;

  // readonly for external functions through accessor fields
  private _integralSumCache?: number;
  private _integralCache?: ContinuousShape;

  constructor(args: {
    continuous: ContinuousShape;
    discrete: DiscreteShape;
    integralSumCache?: number;
    integralCache?: ContinuousShape;
  }) {
    this.continuous = args.continuous;
    this.discrete = args.discrete;
    this._integralSumCache = args.integralSumCache;
    this._integralCache = args.integralCache;
  }

  get integralCache() {
    return this._integralCache;
  }
  get integralSumCache() {
    return this._integralSumCache;
  }

  withAdjustedIntegralSum(integralSumCache: number): MixedShape {
    return new MixedShape({
      continuous: this.continuous,
      discrete: this.discrete,
      integralSumCache,
      integralCache: this.integralCache,
    });
  }

  minX() {
    return Math.min(this.continuous.minX(), this.discrete.minX());
  }
  maxX() {
    return Math.max(this.continuous.maxX(), this.discrete.maxX());
  }

  toContinuous() {
    return this.continuous;
  }
  toDiscrete() {
    return this.discrete;
  }
  toMixed() {
    return this;
  }

  truncate(leftCutoff: number | undefined, rightCutoff: number | undefined) {
    return new MixedShape({
      continuous: this.continuous.truncate(leftCutoff, rightCutoff),
      discrete: this.discrete.truncate(leftCutoff, rightCutoff),
    });
  }

  normalize() {
    const continuousIntegralSum = this.continuous.integralSum();
    const discreteIntegralSum = this.discrete.integralSum();

    const totalIntegralSum = continuousIntegralSum + discreteIntegralSum;
    const newContinuousSum = continuousIntegralSum / totalIntegralSum;
    const newDiscreteSum = discreteIntegralSum / totalIntegralSum;

    const normalizedContinuous = this.continuous
      .scaleBy(newContinuousSum / continuousIntegralSum)
      .withAdjustedIntegralSum(newContinuousSum);

    const normalizedDiscrete = this.discrete
      .scaleBy(newDiscreteSum / discreteIntegralSum)
      .withAdjustedIntegralSum(newDiscreteSum);

    return new MixedShape({
      continuous: normalizedContinuous,
      discrete: normalizedDiscrete,
      integralSumCache: 1,
    });
  }
  xToY(x: number) {
    // This evaluates the mixedShape at x, interpolating if necessary.
    // Note that we normalize entire mixedShape first.
    // (TODO - this must be extremely slow)
    const { continuous, discrete } = this.normalize();
    const c = continuous.xToY(x);
    const d = discrete.xToY(x);
    return MixedPoint.add(c, d); // "add" here just combines the two values into a single MixedPoint.
  }
  toDiscreteProbabilityMassFraction() {
    const discreteIntegralSum = this.discrete.integralSum();
    const continuousIntegralSum = this.continuous.integralSum();
    const totalIntegralSum = discreteIntegralSum + continuousIntegralSum;
    return discreteIntegralSum / totalIntegralSum;
  }
  downsample(count: number) {
    // We will need to distribute the new xs fairly between the discrete and continuous shapes.
    // The easiest way to do this is to simply go by the previous probability masses.
    const discreteIntegralSum = this.discrete.integralSum();
    const continuousIntegralSum = this.continuous.integralSum();
    const totalIntegralSum = discreteIntegralSum + continuousIntegralSum;
    // TODO: figure out what to do when the totalIntegralSum is zero.
    const downsampledDiscrete = this.discrete.downsample(
      Math.floor((count * discreteIntegralSum) / totalIntegralSum)
    );
    const downsampledContinuous = this.continuous.downsample(
      Math.floor((count * continuousIntegralSum) / totalIntegralSum)
    );
    return new MixedShape({
      continuous: downsampledContinuous,
      discrete: downsampledDiscrete,
      integralSumCache: this.integralSumCache, // TODO - is it safe to carry these?
      integralCache: this.integralCache,
    });
  }

  integral() {
    if (!this._integralCache) {
      // note: if the underlying shapes aren't normalized, then these integrals won't be either -- but that's the way it should be.
      const continuousIntegral = this.continuous.integral();
      const discreteIntegral = Continuous.stepwiseToLinear(
        this.discrete.integral()
      );
      this._integralCache = new ContinuousShape({
        xyShape: XYShape.PointwiseCombination.addCombine(
          XYShape.XtoY.continuousInterpolator("Linear", "UseOutermostPoints"),
          continuousIntegral.xyShape,
          discreteIntegral.xyShape
        ),
      });
    }
    return this._integralCache;
  }
  integralSum() {
    return (this._integralSumCache ??= this.integral().lastY());
  }
  integralXtoY(f: number) {
    return XYShape.XtoY.linear(this.integral().xyShape, f);
  }
  integralYtoX(f: number) {
    return XYShape.YtoX.linear(this.integral().xyShape, f);
  }

  // This pipes all ys (continuous and discrete) through fn.
  // If mapY is a linear operation, we might be able to update the integralSumCaches as well;
  // if not, they'll be set to None.
  mapY(
    fn: (y: number) => number,
    integralSumCacheFn: ((sum: number) => number | undefined) | undefined,
    integralCacheFn:
      | ((cache: ContinuousShape) => ContinuousShape | undefined)
      | undefined
  ) {
    const discrete = this.discrete.mapY(
      fn,
      integralSumCacheFn,
      integralCacheFn
    );
    const continuous = this.continuous.mapY(
      fn,
      integralSumCacheFn,
      integralCacheFn
    );
    return new MixedShape({
      discrete,
      continuous,
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
    integralSumCacheFn: undefined | ((sum: number) => number | undefined),
    integralCacheFn:
      | undefined
      | ((cache: ContinuousShape) => ContinuousShape | undefined)
  ): Result.result<MixedShape, E> {
    const discreteResult = this.discrete.mapYResult(
      fn,
      integralSumCacheFn,
      integralCacheFn
    );
    const continuousResult = this.continuous.mapYResult(
      fn,
      integralSumCacheFn,
      integralCacheFn
    );
    if (!continuousResult.ok) {
      return continuousResult;
    }
    if (!discreteResult.ok) {
      return discreteResult;
    }
    const continuous = continuousResult.value;
    const discrete = discreteResult.value;
    return Result.Ok(
      new MixedShape({
        discrete,
        continuous,
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
  mean(): number {
    const discreteMean = this.discrete.mean();
    const continuousMean = this.continuous.mean();
    // means are already weighted by subshape probabilities
    return (discreteMean + continuousMean) / this.integralSum();
  }
  variance(): number {
    // the combined mean is the weighted sum of the two:
    const discreteIntegralSum = this.discrete.integralSum();
    const continuousIntegralSum = this.continuous.integralSum();
    const totalIntegralSum = discreteIntegralSum + continuousIntegralSum;
    const getMeanOfSquares = ({ discrete, continuous }: MixedShape) => {
      const discreteMean = discrete.shapeMap(XYShape.T.square).mean();
      const continuousMean = continuous.getMeanOfSquares();
      return (
        (discreteMean * discreteIntegralSum +
          continuousMean * continuousIntegralSum) /
        totalIntegralSum
      );
    };

    switch (discreteIntegralSum / totalIntegralSum) {
      case 1:
        return this.discrete.variance();
      case 0:
        return this.continuous.variance();
      default:
        return XYShape.Analysis.getVarianceDangerously(
          this,
          (t) => t.mean(),
          (t) => getMeanOfSquares(t)
        );
    }
  }
}

// let totalLength = (t: t): int => {
//   let continuousLength = t.continuous.xyShape->XYShape.T.length
//   let discreteLength = t.discrete.xyShape->XYShape.T.length

//   continuousLength + discreteLength
// }

// let scaleBy = (t: t, scale): t => {
//   let scaledDiscrete = Discrete.scaleBy(t.discrete, scale)
//   let scaledContinuous = Continuous.scaleBy(t.continuous, scale)
//   let scaledIntegralCache = E.O.bind(t.integralCache, v => Some(Continuous.scaleBy(v, scale)))
//   let scaledIntegralSumCache = E.O.bind(t.integralSumCache, s => Some(s *. scale))
//   make(
//     ~discrete=scaledDiscrete,
//     ~continuous=scaledContinuous,
//     ~integralSumCache=scaledIntegralSumCache,
//     ~integralCache=scaledIntegralCache,
//   )
// }

export const combineAlgebraically = (
  op: ConvolutionOperation,
  t1: MixedShape,
  t2: MixedShape
): MixedShape => {
  // Discrete convolution can cause a huge increase in the number of samples,
  // so we'll first downsample.

  // An alternative (to be explored in the future) may be to first perform the full convolution and then to downsample the result;
  // to use non-uniform fast Fourier transforms (for addition only), add web workers or gpu.js, etc. ...

  // we have to figure out where to downsample, and how to effectively
  //let downsampleIfTooLarge = (t: t) => {
  //  let sqtl = sqrt(float_of_int(totalLength(t)));
  //  sqtl > 10 ? T.downsample(int_of_float(sqtl), t) : t;
  //};

  // continuous (*) continuous => continuous, but also
  // discrete (*) continuous => continuous (and vice versa). We have to take care of all combos and then combine them:
  const ccConvResult = Continuous.combineAlgebraically(
    op,
    t1.continuous,
    t2.continuous
  );
  const dcConvResult = Continuous.combineAlgebraicallyWithDiscrete(
    op,
    t2.continuous,
    t1.discrete,
    "First"
  );
  const cdConvResult = Continuous.combineAlgebraicallyWithDiscrete(
    op,
    t1.continuous,
    t2.discrete,
    "Second"
  );
  const continuousConvResult = Continuous.sum([
    ccConvResult,
    dcConvResult,
    cdConvResult,
  ]);

  // ... finally, discrete (*) discrete => discrete, obviously:
  const discreteConvResult = Discrete.combineAlgebraically(
    op,
    t1.discrete,
    t2.discrete
  );

  const combinedIntegralSum = Common.combineIntegralSums(
    (a, b) => a * b,
    t1.integralSumCache,
    t2.integralSumCache
  );

  return new MixedShape({
    discrete: discreteConvResult,
    continuous: continuousConvResult,
    integralSumCache: combinedIntegralSum,
    integralCache: undefined,
  });
};

export const combinePointwise = <E>(
  t1: MixedShape,
  t2: MixedShape,
  fn: (v1: number, v2: number) => Result.result<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined,
  integralCachesFn: (
    v1: ContinuousShape,
    v2: ContinuousShape
  ) => ContinuousShape | undefined = () => undefined
): Result.result<MixedShape, E> => {
  const isDefined = <T>(argument: T | undefined): argument is T => {
    return argument !== undefined;
  };

  const reducedDiscrete = Discrete.reduce(
    [t1, t2].map((t) => t.toDiscrete()).filter(isDefined),
    fn,
    integralSumCachesFn
  );

  const reducedContinuous = Continuous.reduce(
    [t1, t2].map((t) => t.toContinuous()).filter(isDefined),
    fn,
    integralSumCachesFn
  );

  const combinedIntegralSum = Common.combineIntegralSums(
    integralSumCachesFn,
    t1.integralSumCache,
    t2.integralSumCache
  );

  const combinedIntegral = Common.combineIntegrals(
    integralCachesFn,
    t1.integralCache,
    t2.integralCache
  );

  return Result.fmap(
    Result.merge(reducedContinuous, reducedDiscrete),
    ([continuous, discrete]) =>
      new MixedShape({
        continuous,
        discrete,
        integralSumCache: combinedIntegralSum,
        integralCache: combinedIntegral,
      })
  );
};

export const buildMixedShape = ({
  continuous,
  discrete,
}: {
  continuous?: ContinuousShape;
  discrete?: DiscreteShape;
}): AnyPointSet | undefined => {
  continuous ??= new ContinuousShape({
    integralSumCache: 0,
    xyShape: { xs: [], ys: [] },
  });
  discrete ??= new DiscreteShape({
    integralSumCache: 0,
    xyShape: { xs: [], ys: [] },
  });
  const cLength = continuous.xyShape.xs.length;
  const dLength = discrete.xyShape.xs.length;
  if (cLength < 2 && dLength == 0) {
    return undefined;
  } else if (cLength < 2) {
    return discrete;
  } else if (dLength == 0) {
    return continuous;
  } else {
    const mixedDist = new MixedShape({ continuous, discrete });
    return mixedDist;
  }
};
