open Distributions;

type t = DistTypes.mixedShape;
let make = (~continuous, ~discrete, integralSumCache, integralCache): t => {continuous, discrete, integralSumCache, integralCache};

let totalLength = (t: t): int => {
  let continuousLength =
    t.continuous |> Continuous.getShape |> XYShape.T.length;
  let discreteLength = t.discrete |> Discrete.getShape |> XYShape.T.length;

  continuousLength + discreteLength;
};

let scaleBy = (~scale=1.0, t: t): t => {
  let scaledDiscrete = Discrete.scaleBy(~scale, t.discrete);
  let scaledContinuous = Continuous.scaleBy(~scale, t.continuous);
  let scaledIntegralCache = E.O.bind(t.integralCache, v => Some(Continuous.scaleBy(~scale, v)));
  let scaledIntegralSumCache = E.O.bind(t.integralSumCache, s => Some(s *. scale));
  make(~discrete=scaledDiscrete, ~continuous=scaledContinuous, scaledIntegralSumCache, scaledIntegralCache);
};

let toContinuous = ({continuous}: t) => Some(continuous);
let toDiscrete = ({discrete}: t) => Some(discrete);

module T =
  Dist({
    type t = DistTypes.mixedShape;
    type integral = DistTypes.continuousShape;
    let minX = ({continuous, discrete}: t) => {
      min(Continuous.T.minX(continuous), Discrete.T.minX(discrete));
    };
    let maxX = ({continuous, discrete}: t) =>
      max(Continuous.T.maxX(continuous), Discrete.T.maxX(discrete));
    let toShape = (t: t): DistTypes.shape => Mixed(t);

    let toContinuous = toContinuous;
    let toDiscrete = toDiscrete;

    let truncate =
        (
          leftCutoff: option(float),
          rightCutoff: option(float),
          {discrete, continuous}: t,
        ) => {
      let truncatedContinuous =
        Continuous.T.truncate(leftCutoff, rightCutoff, continuous);
      let truncatedDiscrete =
        Discrete.T.truncate(leftCutoff, rightCutoff, discrete);

      make(~discrete=truncatedDiscrete, ~continuous=truncatedContinuous, None, None);
    };

    let normalize = (t: t): t => {
      let continuousIntegral = Continuous.T.Integral.get(t.continuous);
      let discreteIntegral = Discrete.T.Integral.get(t.discrete);

      let continuous = t.continuous |> Continuous.updateIntegralCache(Some(continuousIntegral));
      let discrete = t.discrete |> Discrete.updateIntegralCache(Some(discreteIntegral));

      let continuousIntegralSum =
        Continuous.T.Integral.sum(continuous);
      let discreteIntegralSum =
        Discrete.T.Integral.sum(discrete);
      let totalIntegralSum = continuousIntegralSum +. discreteIntegralSum;

      let newContinuousSum = continuousIntegralSum /. totalIntegralSum;
      let newDiscreteSum = discreteIntegralSum /. totalIntegralSum;

      let normalizedContinuous =
        continuous
        |> Continuous.scaleBy(~scale=newContinuousSum /. continuousIntegralSum)
        |> Continuous.updateIntegralSumCache(Some(newContinuousSum));
      let normalizedDiscrete =
        discrete
        |> Discrete.scaleBy(~scale=newDiscreteSum /. discreteIntegralSum)
        |> Discrete.updateIntegralSumCache(Some(newDiscreteSum));

      make(~continuous=normalizedContinuous, ~discrete=normalizedDiscrete, Some(1.0), None);
    };

    let xToY = (x, t: t) => {
      // This evaluates the mixedShape at x, interpolating if necessary.
      // Note that we normalize entire mixedShape first.
      let {continuous, discrete}: t = normalize(t);
      let c = Continuous.T.xToY(x, continuous);
      let d = Discrete.T.xToY(x, discrete);
      DistTypes.MixedPoint.add(c, d); // "add" here just combines the two values into a single MixedPoint.
    };

    let toDiscreteProbabilityMassFraction = ({discrete, continuous}: t) => {
      let discreteIntegralSum =
        Discrete.T.Integral.sum(discrete);
      let continuousIntegralSum =
        Continuous.T.Integral.sum(continuous);
      let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum;

      discreteIntegralSum /. totalIntegralSum;
    };

    let downsample = (count, t: t): t => {
      // We will need to distribute the new xs fairly between the discrete and continuous shapes.
      // The easiest way to do this is to simply go by the previous probability masses.

      let discreteIntegralSum =
        Discrete.T.Integral.sum(t.discrete);
      let continuousIntegralSum =
        Continuous.T.Integral.sum(t.continuous);
      let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum;

      // TODO: figure out what to do when the totalIntegralSum is zero.

      let downsampledDiscrete =
        Discrete.T.downsample(
          int_of_float(
            float_of_int(count) *. (discreteIntegralSum /. totalIntegralSum),
          ),
          t.discrete,
        );

      let downsampledContinuous =
        Continuous.T.downsample(
          int_of_float(
            float_of_int(count) *. (continuousIntegralSum /. totalIntegralSum),
          ),
          t.continuous,
        );

      {...t, discrete: downsampledDiscrete, continuous: downsampledContinuous};
    };

    let normalizedToContinuous = (t: t) => Some(normalize(t).continuous);

    let normalizedToDiscrete = ({discrete} as t: t) =>
      Some(normalize(t).discrete);

    let integral = (t: t) => {
      switch (t.integralCache) {
      | Some(cache) => cache
      | None =>
        // note: if the underlying shapes aren't normalized, then these integrals won't be either -- but that's the way it should be.
        let continuousIntegral = Continuous.T.Integral.get(t.continuous);
        let discreteIntegral = Continuous.stepwiseToLinear(Discrete.T.Integral.get(t.discrete));

        Continuous.make(
          `Linear,
          XYShape.PointwiseCombination.combine(
            (+.),
            XYShape.XtoY.continuousInterpolator(`Linear, `UseOutermostPoints),
            XYShape.XtoY.continuousInterpolator(`Linear, `UseOutermostPoints),
            Continuous.getShape(continuousIntegral),
            Continuous.getShape(discreteIntegral),
          ),
          None,
          None,
        );
      };
    };

    let integralEndY = (t: t) => {
      t |> integral |> Continuous.lastY;
    };

    let integralXtoY = (f, t) => {
      t |> integral |> Continuous.getShape |> XYShape.XtoY.linear(f);
    };

    let integralYtoX = (f, t) => {
      t |> integral |> Continuous.getShape |> XYShape.YtoX.linear(f);
    };

    // This pipes all ys (continuous and discrete) through fn.
    // If mapY is a linear operation, we might be able to update the integralSumCaches as well;
    // if not, they'll be set to None.
    let mapY =
        (
          ~integralSumCacheFn=previousIntegralSum => None,
          ~integralCacheFn=previousIntegral => None,
          fn,
          t: t,
        )
        : t => {
      let yMappedDiscrete: DistTypes.discreteShape =
        t.discrete
        |> Discrete.T.mapY(fn)
        |> Discrete.updateIntegralSumCache(E.O.bind(t.discrete.integralSumCache, integralSumCacheFn))
        |> Discrete.updateIntegralCache(E.O.bind(t.discrete.integralCache, integralCacheFn));

      let yMappedContinuous: DistTypes.continuousShape =
        t.continuous
        |> Continuous.T.mapY(fn)
        |> Continuous.updateIntegralSumCache(E.O.bind(t.continuous.integralSumCache, integralSumCacheFn))
        |> Continuous.updateIntegralCache(E.O.bind(t.continuous.integralCache, integralCacheFn));

      {
        discrete: yMappedDiscrete,
        continuous: yMappedContinuous,
        integralSumCache: E.O.bind(t.integralSumCache, integralSumCacheFn),
        integralCache: E.O.bind(t.integralCache, integralCacheFn),
      };
    };

    let mean = ({discrete, continuous}: t): float => {
      let discreteMean = Discrete.T.mean(discrete);
      let continuousMean = Continuous.T.mean(continuous);

      // the combined mean is the weighted sum of the two:
      let discreteIntegralSum = Discrete.T.Integral.sum(discrete);
      let continuousIntegralSum = Continuous.T.Integral.sum(continuous);
      let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum;

      (
        discreteMean
        *. discreteIntegralSum
        +. continuousMean
        *. continuousIntegralSum
      )
      /. totalIntegralSum;
    };

    let variance = ({discrete, continuous} as t: t): float => {
      // the combined mean is the weighted sum of the two:
      let discreteIntegralSum = Discrete.T.Integral.sum(discrete);
      let continuousIntegralSum = Continuous.T.Integral.sum(continuous);
      let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum;

      let getMeanOfSquares = ({discrete, continuous}: t) => {
        let discreteMean =
          discrete
          |> Discrete.shapeMap(XYShape.Analysis.squareXYShape)
          |> Discrete.T.mean;
        let continuousMean =
          continuous |> XYShape.Analysis.getMeanOfSquaresContinuousShape;
        (
          discreteMean
          *. discreteIntegralSum
          +. continuousMean
          *. continuousIntegralSum
        )
        /. totalIntegralSum;
      };

      switch (discreteIntegralSum /. totalIntegralSum) {
      | 1.0 => Discrete.T.variance(discrete)
      | 0.0 => Continuous.T.variance(continuous)
      | _ =>
        XYShape.Analysis.getVarianceDangerously(t, mean, getMeanOfSquares)
      };
    };
  });

let combineAlgebraically =
    (op: ExpressionTypes.algebraicOperation, t1: t, t2: t)
    : t => {
  // Discrete convolution can cause a huge increase in the number of samples,
  // so we'll first downsample.

  // An alternative (to be explored in the future) may be to first perform the full convolution and then to downsample the result;
  // to use non-uniform fast Fourier transforms (for addition only), add web workers or gpu.js, etc. ...

  // TODO: figure out when to downsample strategically. Could be an evaluationParam?
  /*let downsampleIfTooLarge = (t: t) => {
    let sqtl = sqrt(float_of_int(totalLength(t)));
    sqtl > 10. && downsample ? T.downsample(int_of_float(sqtl), t) : t;
  };

  let t1d = downsampleIfTooLarge(t1);
  let t2d = downsampleIfTooLarge(t2);
  */

  // continuous (*) continuous => continuous, but also
  // discrete (*) continuous => continuous (and vice versa). We have to take care of all combos and then combine them:
  let ccConvResult =
    Continuous.combineAlgebraically(
      op,
      t1.continuous,
      t2.continuous,
    );
  let dcConvResult =
    Continuous.combineAlgebraicallyWithDiscrete(
      op,
      t2.continuous,
      t1.discrete,
    );
  let cdConvResult =
    Continuous.combineAlgebraicallyWithDiscrete(
      op,
      t1.continuous,
      t2.discrete,
    );
  let continuousConvResult =
    Continuous.reduce((+.), [|ccConvResult, dcConvResult, cdConvResult|]);

  // ... finally, discrete (*) discrete => discrete, obviously:
  let discreteConvResult =
    Discrete.combineAlgebraically(op, t1.discrete, t2.discrete);

  let combinedIntegralSum =
    Common.combineIntegralSums(
      (a, b) => Some(a *. b),
      t1.integralSumCache,
      t2.integralSumCache,
    );

  {discrete: discreteConvResult, continuous: continuousConvResult, integralSumCache: combinedIntegralSum, integralCache: None};
};

let combinePointwise = (~integralSumCachesFn = (_, _) => None, ~integralCachesFn = (_, _) => None, fn, t1: t, t2: t): t => {
  let reducedDiscrete =
    [|t1, t2|]
    |> E.A.fmap(toDiscrete)
    |> E.A.O.concatSomes
    |> Discrete.reduce(~integralSumCachesFn, ~integralCachesFn, fn);

  let reducedContinuous =
    [|t1, t2|]
    |> E.A.fmap(toContinuous)
    |> E.A.O.concatSomes
    |> Continuous.reduce(~integralSumCachesFn, ~integralCachesFn, fn);

  let combinedIntegralSum =
    Common.combineIntegralSums(
      integralSumCachesFn,
      t1.integralSumCache,
      t2.integralSumCache,
    );

  let combinedIntegral =
    Common.combineIntegrals(
      integralCachesFn,
      t1.integralCache,
      t2.integralCache,
    );

  make(~discrete=reducedDiscrete, ~continuous=reducedContinuous, combinedIntegralSum, combinedIntegral);
};
