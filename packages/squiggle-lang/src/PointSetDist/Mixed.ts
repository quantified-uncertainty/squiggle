import * as XYShape from "../XYShape";
import * as Continuous from "./Continuous";
import * as Discrete from "./Discrete";
import * as MixedPoint from "./MixedPoint";
import * as RSResult from "../rsResult";
import * as Common from "./Common";
import { ContinuousShape } from "./Continuous";
import { DiscreteShape } from "./Discrete";
import { ConvolutionOperation, PointSet } from "./types";

export type MixedShape = {
  continuous: ContinuousShape;
  discrete: DiscreteShape;
  integralSumCache?: number;
  integralCache?: ContinuousShape;
};

export const make = (
  continuous: ContinuousShape,
  discrete: DiscreteShape,
  integralSumCache: number | undefined,
  integralCache: ContinuousShape | undefined
): MixedShape => ({
  continuous,
  discrete,
  integralSumCache,
  integralCache,
});

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

const updateIntegralCache = (
  t: MixedShape,
  integralCache: ContinuousShape | undefined
): MixedShape => {
  return {
    ...t,
    integralCache,
  };
};

export const T: PointSet<MixedShape> = {
  minX({ continuous, discrete }) {
    return Math.min(Continuous.T.minX(continuous), Discrete.T.minX(discrete));
  },
  maxX({ continuous, discrete }) {
    return Math.max(Continuous.T.maxX(continuous), Discrete.T.maxX(discrete));
  },

  toContinuous(t) {
    return t.continuous;
  },
  toDiscrete(t) {
    return t.discrete;
  },
  toMixed(t) {
    return t;
  },

  updateIntegralCache,
  truncate(leftCutoff, rightCutoff, { discrete, continuous }) {
    const truncatedContinuous = Continuous.T.truncate(
      leftCutoff,
      rightCutoff,
      continuous
    );
    const truncatedDiscrete = Discrete.T.truncate(
      leftCutoff,
      rightCutoff,
      discrete
    );
    return make(truncatedContinuous, truncatedDiscrete, undefined, undefined);
  },
  normalize(t) {
    const continuousIntegral = Continuous.T.integral(t.continuous);
    const discreteIntegral = Discrete.T.integral(t.discrete);
    const continuous = Continuous.T.updateIntegralCache(
      t.continuous,
      continuousIntegral
    );
    const discrete = Discrete.updateIntegralCache(t.discrete, discreteIntegral);
    const continuousIntegralSum = Continuous.T.integralEndY(continuous);
    const discreteIntegralSum = Discrete.T.integralEndY(discrete);
    const totalIntegralSum = continuousIntegralSum + discreteIntegralSum;
    const newContinuousSum = continuousIntegralSum / totalIntegralSum;
    const newDiscreteSum = discreteIntegralSum / totalIntegralSum;
    const normalizedContinuous = Continuous.updateIntegralSumCache(
      Continuous.scaleBy(continuous, newContinuousSum / continuousIntegralSum),
      newContinuousSum
    );
    const normalizedDiscrete = Discrete.updateIntegralSumCache(
      Discrete.scaleBy(discrete, newDiscreteSum / discreteIntegralSum),
      newDiscreteSum
    );
    return make(normalizedContinuous, normalizedDiscrete, 1, undefined);
  },
  xToY(x, t) {
    // This evaluates the mixedShape at x, interpolating if necessary.
    // Note that we normalize entire mixedShape first.
    const { continuous, discrete } = T.normalize(t);
    const c = Continuous.T.xToY(x, continuous);
    const d = Discrete.T.xToY(x, discrete);
    return MixedPoint.add(c, d); // "add" here just combines the two values into a single MixedPoint.
  },
  toDiscreteProbabilityMassFraction({ discrete, continuous }) {
    const discreteIntegralSum = Discrete.T.integralEndY(discrete);
    const continuousIntegralSum = Continuous.T.integralEndY(continuous);
    const totalIntegralSum = discreteIntegralSum + continuousIntegralSum;
    return discreteIntegralSum / totalIntegralSum;
  },
  downsample(count, t) {
    // We will need to distribute the new xs fairly between the discrete and continuous shapes.
    // The easiest way to do this is to simply go by the previous probability masses.
    const discreteIntegralSum = Discrete.T.integralEndY(t.discrete);
    const continuousIntegralSum = Continuous.T.integralEndY(t.continuous);
    const totalIntegralSum = discreteIntegralSum + continuousIntegralSum;
    // TODO: figure out what to do when the totalIntegralSum is zero.
    const downsampledDiscrete = Discrete.T.downsample(
      Math.floor((count * discreteIntegralSum) / totalIntegralSum),
      t.discrete
    );
    const downsampledContinuous = Continuous.T.downsample(
      Math.floor((count * continuousIntegralSum) / totalIntegralSum),
      t.continuous
    );
    return {
      ...t,
      discrete: downsampledDiscrete,
      continuous: downsampledContinuous,
    };
  },
  integral(t) {
    if (t.integralCache) {
      return t.integralCache;
    }
    // note: if the underlying shapes aren't normalized, then these integrals won't be either -- but that's the way it should be.
    const continuousIntegral = Continuous.T.integral(t.continuous);
    const discreteIntegral = Continuous.stepwiseToLinear(
      Discrete.T.integral(t.discrete)
    );
    return Continuous.make(
      XYShape.PointwiseCombination.addCombine(
        XYShape.XtoY.continuousInterpolator("Linear", "UseOutermostPoints"),
        continuousIntegral.xyShape,
        discreteIntegral.xyShape
      )
    );
  },
  integralEndY(t) {
    return Continuous.lastY(T.integral(t));
  },
  integralXtoY(f, t) {
    return XYShape.XtoY.linear(T.integral(t).xyShape, f);
  },
  integralYtoX(f, t) {
    return XYShape.YtoX.linear(T.integral(t).xyShape, f);
  },
  // This pipes all ys (continuous and discrete) through fn.
  // If mapY is a linear operation, we might be able to update the integralSumCaches as well;
  // if not, they'll be set to None.
  mapY(t, fn, integralSumCacheFn, integralCacheFn) {
    const discrete = Discrete.T.mapY(
      t.discrete,
      fn,
      integralSumCacheFn,
      integralCacheFn
    );
    const continuous = Continuous.T.mapY(
      t.continuous,
      fn,
      integralSumCacheFn,
      integralCacheFn
    );
    return {
      discrete,
      continuous,
      integralSumCache:
        t.integralSumCache === undefined
          ? undefined
          : integralSumCacheFn?.(t.integralSumCache),
      integralCache:
        t.integralCache === undefined
          ? undefined
          : integralCacheFn?.(t.integralCache),
    };
  },
  mapYResult(t, fn, integralSumCacheFn, integralCacheFn) {
    const discreteResult = Discrete.T.mapYResult(
      t.discrete,
      fn,
      integralSumCacheFn,
      integralCacheFn
    );
    const continuousResult = Continuous.T.mapYResult(
      t.continuous,
      fn,
      integralSumCacheFn,
      integralCacheFn
    );
    if (continuousResult.TAG === RSResult.E.Error) {
      return continuousResult;
    }
    if (discreteResult.TAG === RSResult.E.Error) {
      return discreteResult;
    }
    const continuous = continuousResult._0;
    const discrete = discreteResult._0;
    return RSResult.Ok({
      discrete,
      continuous,
      integralSumCache:
        t.integralSumCache === undefined
          ? undefined
          : integralSumCacheFn?.(t.integralSumCache),
      integralCache:
        t.integralCache === undefined
          ? undefined
          : integralCacheFn?.(t.integralCache),
    });
  },
  mean({ discrete, continuous }): number {
    const discreteMean = Discrete.T.mean(discrete);
    const continuousMean = Continuous.T.mean(continuous);
    // the combined mean is the weighted sum of the two:
    const discreteIntegralSum = Discrete.T.integralEndY(discrete);
    const continuousIntegralSum = Continuous.T.integralEndY(continuous);
    const totalIntegralSum = discreteIntegralSum + continuousIntegralSum;
    return (
      (discreteMean * discreteIntegralSum +
        continuousMean * continuousIntegralSum) /
      totalIntegralSum
    );
  },
  variance(t): number {
    const { discrete, continuous } = t;
    // the combined mean is the weighted sum of the two:
    const discreteIntegralSum = Discrete.T.integralEndY(discrete);
    const continuousIntegralSum = Continuous.T.integralEndY(continuous);
    const totalIntegralSum = discreteIntegralSum + continuousIntegralSum;
    const getMeanOfSquares = ({ discrete, continuous }: MixedShape) => {
      const discreteMean = Discrete.T.mean(
        Discrete.shapeMap(discrete, XYShape.T.square)
      );
      const continuousMean = Continuous.Analysis.getMeanOfSquares(continuous);
      return (
        (discreteMean * discreteIntegralSum +
          continuousMean * continuousIntegralSum) /
        totalIntegralSum
      );
    };

    switch (discreteIntegralSum / totalIntegralSum) {
      case 1:
        return Discrete.T.variance(discrete);
      case 0:
        return Continuous.T.variance(continuous);
      default:
        return XYShape.Analysis.getVarianceDangerously(
          t,
          T.mean,
          getMeanOfSquares
        );
    }
  },
};

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

  return {
    discrete: discreteConvResult,
    continuous: continuousConvResult,
    integralSumCache: combinedIntegralSum,
    integralCache: undefined,
  };
};

export const combinePointwise = <E>(
  t1: MixedShape,
  t2: MixedShape,
  fn: (v1: number, v2: number) => RSResult.rsResult<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined,
  integralCachesFn: (
    v1: ContinuousShape,
    v2: ContinuousShape
  ) => ContinuousShape | undefined = () => undefined
): RSResult.rsResult<MixedShape, E> => {
  const isDefined = <T>(argument: T | undefined): argument is T => {
    return argument !== undefined;
  };

  const reducedDiscrete = Discrete.reduce(
    [t1, t2].map(T.toDiscrete).filter(isDefined),
    fn,
    integralSumCachesFn
  );

  const reducedContinuous = Continuous.reduce(
    [t1, t2].map(T.toContinuous).filter(isDefined),
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

  return RSResult.fmap(
    RSResult.merge(reducedContinuous, reducedDiscrete),
    ([continuous, discrete]) =>
      make(continuous, discrete, combinedIntegralSum, combinedIntegral)
  );
};
