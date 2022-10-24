@@warning("-27") //TODO: Remove and fix the warning
@@warning("-32") //TODO: Remove and fix the warning
open Distributions

type t = PointSetTypes.mixedShape
let make = (~integralSumCache=None, ~integralCache=None, ~continuous, ~discrete): t => {
  continuous,
  discrete,
  integralSumCache,
  integralCache,
}

let totalLength = (t: t): int => {
  let continuousLength = t.continuous->Continuous.getShape->XYShape.T.length
  let discreteLength = t.discrete->Discrete.getShape->XYShape.T.length

  continuousLength + discreteLength
}

let scaleBy = (t: t, scale): t => {
  let scaledDiscrete = Discrete.scaleBy(t.discrete, scale)
  let scaledContinuous = Continuous.scaleBy(t.continuous, scale)
  let scaledIntegralCache = E.O.bind(t.integralCache, v => Some(Continuous.scaleBy(v, scale)))
  let scaledIntegralSumCache = E.O.bind(t.integralSumCache, s => Some(s *. scale))
  make(
    ~discrete=scaledDiscrete,
    ~continuous=scaledContinuous,
    ~integralSumCache=scaledIntegralSumCache,
    ~integralCache=scaledIntegralCache,
  )
}

let toContinuous = ({continuous}: t) => Some(continuous)
let toDiscrete = ({discrete}: t) => Some(discrete)

let updateIntegralCache = (t: t, integralCache): t => {
  ...t,
  integralCache,
}

let combinePointwise = (
  ~integralSumCachesFn=(_, _) => None,
  ~integralCachesFn=(_, _) => None,
  fn: (float, float) => result<float, 'e>,
  t1: t,
  t2: t,
): result<t, 'e> => {
  let reducedDiscrete =
    [t1, t2]
    ->E.A.fmap(toDiscrete)
    ->E.A.O.concatSomes
    ->Discrete.reduce(~integralSumCachesFn, fn)
    ->E.R.toExn("Theoretically unreachable state")

  let reducedContinuous =
    [t1, t2]->E.A.fmap(toContinuous)->E.A.O.concatSomes->Continuous.reduce(~integralSumCachesFn, fn)

  let combinedIntegralSum = Common.combineIntegralSums(
    integralSumCachesFn,
    t1.integralSumCache,
    t2.integralSumCache,
  )

  let combinedIntegral = Common.combineIntegrals(
    integralCachesFn,
    t1.integralCache,
    t2.integralCache,
  )
  reducedContinuous->E.R.fmap(continuous =>
    make(
      ~integralSumCache=combinedIntegralSum,
      ~integralCache=combinedIntegral,
      ~discrete=reducedDiscrete,
      ~continuous,
    )
  )
}

module T = Dist({
  type t = PointSetTypes.mixedShape
  type integral = PointSetTypes.continuousShape
  let minX = ({continuous, discrete}: t) =>
    min(Continuous.T.minX(continuous), Discrete.T.minX(discrete))
  let maxX = ({continuous, discrete}: t) =>
    max(Continuous.T.maxX(continuous), Discrete.T.maxX(discrete))
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => Mixed(t)

  let updateIntegralCache = updateIntegralCache

  let toContinuous = toContinuous
  let toDiscrete = toDiscrete

  let truncate = (
    leftCutoff: option<float>,
    rightCutoff: option<float>,
    {discrete, continuous}: t,
  ) => {
    let truncatedContinuous = Continuous.T.truncate(leftCutoff, rightCutoff, continuous)
    let truncatedDiscrete = Discrete.T.truncate(leftCutoff, rightCutoff, discrete)

    make(
      ~integralSumCache=None,
      ~integralCache=None,
      ~discrete=truncatedDiscrete,
      ~continuous=truncatedContinuous,
    )
  }

  let normalize = (t: t): t => {
    let continuousIntegral = Continuous.T.Integral.get(t.continuous)
    let discreteIntegral = Discrete.T.Integral.get(t.discrete)

    let continuous = t.continuous->Continuous.updateIntegralCache(Some(continuousIntegral))
    let discrete = t.discrete->Discrete.updateIntegralCache(Some(discreteIntegral))

    let continuousIntegralSum = Continuous.T.Integral.sum(continuous)
    let discreteIntegralSum = Discrete.T.Integral.sum(discrete)
    let totalIntegralSum = continuousIntegralSum +. discreteIntegralSum

    let newContinuousSum = continuousIntegralSum /. totalIntegralSum
    let newDiscreteSum = discreteIntegralSum /. totalIntegralSum

    let normalizedContinuous =
      continuous
      ->Continuous.scaleBy(newContinuousSum /. continuousIntegralSum)
      ->Continuous.updateIntegralSumCache(Some(newContinuousSum))
    let normalizedDiscrete =
      discrete
      ->Discrete.scaleBy(newDiscreteSum /. discreteIntegralSum)
      ->Discrete.updateIntegralSumCache(Some(newDiscreteSum))

    make(
      ~integralSumCache=Some(1.0),
      ~integralCache=None,
      ~continuous=normalizedContinuous,
      ~discrete=normalizedDiscrete,
    )
  }

  let xToY = (x, t: t) => {
    // This evaluates the mixedShape at x, interpolating if necessary.
    // Note that we normalize entire mixedShape first.
    let {continuous, discrete}: t = normalize(t)
    let c = Continuous.T.xToY(x, continuous)
    let d = Discrete.T.xToY(x, discrete)
    PointSetTypes.MixedPoint.add(c, d) // "add" here just combines the two values into a single MixedPoint.
  }

  let toDiscreteProbabilityMassFraction = ({discrete, continuous}: t) => {
    let discreteIntegralSum = Discrete.T.Integral.sum(discrete)
    let continuousIntegralSum = Continuous.T.Integral.sum(continuous)
    let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum

    discreteIntegralSum /. totalIntegralSum
  }

  let downsample = (count, t: t): t => {
    // We will need to distribute the new xs fairly between the discrete and continuous shapes.
    // The easiest way to do this is to simply go by the previous probability masses.

    let discreteIntegralSum = Discrete.T.Integral.sum(t.discrete)
    let continuousIntegralSum = Continuous.T.Integral.sum(t.continuous)
    let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum

    // TODO: figure out what to do when the totalIntegralSum is zero.

    let downsampledDiscrete = Discrete.T.downsample(
      int_of_float(float_of_int(count) *. (discreteIntegralSum /. totalIntegralSum)),
      t.discrete,
    )

    let downsampledContinuous = Continuous.T.downsample(
      int_of_float(float_of_int(count) *. (continuousIntegralSum /. totalIntegralSum)),
      t.continuous,
    )

    {...t, discrete: downsampledDiscrete, continuous: downsampledContinuous}
  }

  let integral = (t: t) =>
    switch t.integralCache {
    | Some(cache) => cache
    | None =>
      // note: if the underlying shapes aren't normalized, then these integrals won't be either -- but that's the way it should be.
      let continuousIntegral = Continuous.T.Integral.get(t.continuous)
      let discreteIntegral = Continuous.stepwiseToLinear(Discrete.T.Integral.get(t.discrete))

      Continuous.make(
        XYShape.PointwiseCombination.addCombine(
          XYShape.XtoY.continuousInterpolator(#Linear, #UseOutermostPoints),
          Continuous.getShape(continuousIntegral),
          Continuous.getShape(discreteIntegral),
        ),
      )
    }

  let integralEndY = (t: t) => t->integral->Continuous.lastY

  let integralXtoY = (f, t) => t->integral->Continuous.getShape->XYShape.XtoY.linear(f)
  let integralYtoX = (f, t) => t->integral->Continuous.getShape->XYShape.YtoX.linear(f)

  let createMixedFromContinuousDiscrete = (
    ~integralSumCacheFn=_ => None,
    ~integralCacheFn=_ => None,
    t: t,
    discrete: PointSetTypes.discreteShape,
    continuous: PointSetTypes.continuousShape,
  ): t => {
    let yMappedDiscrete: PointSetTypes.discreteShape =
      discrete
      ->Discrete.updateIntegralSumCache(E.O.bind(t.discrete.integralSumCache, integralSumCacheFn))
      ->Discrete.updateIntegralCache(E.O.bind(t.discrete.integralCache, integralCacheFn))

    let yMappedContinuous: PointSetTypes.continuousShape =
      continuous
      ->Continuous.updateIntegralSumCache(
        E.O.bind(t.continuous.integralSumCache, integralSumCacheFn),
      )
      ->Continuous.updateIntegralCache(E.O.bind(t.continuous.integralCache, integralCacheFn))

    {
      discrete: yMappedDiscrete,
      continuous: yMappedContinuous,
      integralSumCache: E.O.bind(t.integralSumCache, integralSumCacheFn),
      integralCache: E.O.bind(t.integralCache, integralCacheFn),
    }
  }

  // This pipes all ys (continuous and discrete) through fn.
  // If mapY is a linear operation, we might be able to update the integralSumCaches as well;
  // if not, they'll be set to None.
  let mapY = (
    ~integralSumCacheFn=_ => None,
    ~integralCacheFn=_ => None,
    t: t,
    fn: float => float,
  ): t => {
    let discrete = t.discrete->Discrete.T.mapY(fn)
    let continuous = t.continuous->Continuous.T.mapY(fn)
    createMixedFromContinuousDiscrete(
      ~integralCacheFn,
      ~integralSumCacheFn,
      t,
      discrete,
      continuous,
    )
  }

  let mapYResult = (
    ~integralSumCacheFn=_ => None,
    ~integralCacheFn=_ => None,
    t: t,
    fn: float => result<float, 'e>,
  ): result<t, 'e> => {
    E.R.merge(
      Discrete.T.mapYResult(t.discrete, fn),
      Continuous.T.mapYResult(t.continuous, fn),
    )->E.R.fmap(((discreteMapped, continuousMapped)) => {
      createMixedFromContinuousDiscrete(
        ~integralCacheFn,
        ~integralSumCacheFn,
        t,
        discreteMapped,
        continuousMapped,
      )
    })
  }

  let mean = ({discrete, continuous}: t): float => {
    let discreteMean = Discrete.T.mean(discrete)
    let continuousMean = Continuous.T.mean(continuous)

    // the combined mean is the weighted sum of the two:
    let discreteIntegralSum = Discrete.T.Integral.sum(discrete)
    let continuousIntegralSum = Continuous.T.Integral.sum(continuous)
    let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum

    (discreteMean *. discreteIntegralSum +. continuousMean *. continuousIntegralSum) /.
      totalIntegralSum
  }

  let variance = ({discrete, continuous} as t: t): float => {
    // the combined mean is the weighted sum of the two:
    let discreteIntegralSum = Discrete.T.Integral.sum(discrete)
    let continuousIntegralSum = Continuous.T.Integral.sum(continuous)
    let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum

    let getMeanOfSquares = ({discrete, continuous}: t) => {
      let discreteMean = discrete->Discrete.shapeMap(XYShape.T.square)->Discrete.T.mean
      let continuousMean = continuous->Continuous.Analysis.getMeanOfSquares
      (discreteMean *. discreteIntegralSum +. continuousMean *. continuousIntegralSum) /.
        totalIntegralSum
    }

    switch discreteIntegralSum /. totalIntegralSum {
    | 1.0 => Discrete.T.variance(discrete)
    | 0.0 => Continuous.T.variance(continuous)
    | _ => XYShape.Analysis.getVarianceDangerously(t, mean, getMeanOfSquares)
    }
  }
})

let combineAlgebraically = (op: Operation.convolutionOperation, t1: t, t2: t): t => {
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
  let ccConvResult = Continuous.combineAlgebraically(op, t1.continuous, t2.continuous)
  let dcConvResult = Continuous.combineAlgebraicallyWithDiscrete(
    op,
    t2.continuous,
    t1.discrete,
    ~discretePosition=First,
  )
  let cdConvResult = Continuous.combineAlgebraicallyWithDiscrete(
    op,
    t1.continuous,
    t2.discrete,
    ~discretePosition=Second,
  )
  let continuousConvResult = Continuous.sum([ccConvResult, dcConvResult, cdConvResult])

  // ... finally, discrete (*) discrete => discrete, obviously:
  let discreteConvResult = Discrete.combineAlgebraically(op, t1.discrete, t2.discrete)

  let combinedIntegralSum = Common.combineIntegralSums(
    (a, b) => Some(a *. b),
    t1.integralSumCache,
    t2.integralSumCache,
  )

  {
    discrete: discreteConvResult,
    continuous: continuousConvResult,
    integralSumCache: combinedIntegralSum,
    integralCache: None,
  }
}

let combinePointwise = (
  ~integralSumCachesFn=(_, _) => None,
  ~integralCachesFn=(_, _) => None,
  fn: (float, float) => result<float, 'e>,
  t1: t,
  t2: t,
): result<t, 'e> => {
  let reducedDiscrete =
    [t1, t2]->E.A.fmap(toDiscrete)->E.A.O.concatSomes->Discrete.reduce(~integralSumCachesFn, fn)

  let reducedContinuous =
    [t1, t2]->E.A.fmap(toContinuous)->E.A.O.concatSomes->Continuous.reduce(~integralSumCachesFn, fn)

  let combinedIntegralSum = Common.combineIntegralSums(
    integralSumCachesFn,
    t1.integralSumCache,
    t2.integralSumCache,
  )

  let combinedIntegral = Common.combineIntegrals(
    integralCachesFn,
    t1.integralCache,
    t2.integralCache,
  )
  E.R.merge(reducedContinuous, reducedDiscrete)->E.R.fmap(((continuous, discrete)) =>
    make(
      ~integralSumCache=combinedIntegralSum,
      ~integralCache=combinedIntegral,
      ~discrete,
      ~continuous,
    )
  )
}
