open Distributions;

type t = DistTypes.mixedShape;
let make = (~continuous, ~discrete): t => {continuous, discrete};

let totalLength = (t: t): int => {
  let continuousLength =
    t.continuous |> Continuous.getShape |> XYShape.T.length;
  let discreteLength = t.discrete |> Discrete.getShape |> XYShape.T.length;

  continuousLength + discreteLength;
};

let scaleBy = (~scale=1.0, {discrete, continuous}: t): t => {
  let scaledDiscrete = Discrete.scaleBy(~scale, discrete);
  let scaledContinuous = Continuous.scaleBy(~scale, continuous);
  make(~discrete=scaledDiscrete, ~continuous=scaledContinuous);
};

let toContinuous = ({continuous}: t) => Some(continuous);
let toDiscrete = ({discrete}: t) => Some(discrete);

let combinePointwise = (~knownIntegralSumsFn, fn, t1: t, t2: t) => {
  let reducedDiscrete =
    [|t1, t2|]
    |> E.A.fmap(toDiscrete)
    |> E.A.O.concatSomes
    |> Discrete.reduce(~knownIntegralSumsFn, fn);

  let reducedContinuous =
    [|t1, t2|]
    |> E.A.fmap(toContinuous)
    |> E.A.O.concatSomes
    |> Continuous.reduce(~knownIntegralSumsFn, fn);

  make(~discrete=reducedDiscrete, ~continuous=reducedContinuous);
};

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

      make(~discrete=truncatedDiscrete, ~continuous=truncatedContinuous);
    };

    let normalize = (t: t): t => {

      let continuousIntegralSum =
        Continuous.T.Integral.sum(~cache=None, t.continuous);
      let discreteIntegralSum =
        Discrete.T.Integral.sum(~cache=None, t.discrete);
      let totalIntegralSum = continuousIntegralSum +. discreteIntegralSum;

      let newContinuousSum = continuousIntegralSum /. totalIntegralSum;
      let newDiscreteSum = discreteIntegralSum /. totalIntegralSum;

      let normalizedContinuous =
        t.continuous
        |> Continuous.scaleBy(~scale=newContinuousSum /. continuousIntegralSum)
        |> Continuous.updateKnownIntegralSum(Some(newContinuousSum));
      let normalizedDiscrete =
        t.discrete
        |> Discrete.scaleBy(~scale=newDiscreteSum /. discreteIntegralSum)
        |> Discrete.updateKnownIntegralSum(Some(newDiscreteSum));

      make(~continuous=normalizedContinuous, ~discrete=normalizedDiscrete);
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
        Discrete.T.Integral.sum(~cache=None, discrete);
      let continuousIntegralSum =
        Continuous.T.Integral.sum(~cache=None, continuous);
      let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum;

      discreteIntegralSum /. totalIntegralSum;
    };

    let downsample = (~cache=None, count, {discrete, continuous}: t): t => {
      // We will need to distribute the new xs fairly between the discrete and continuous shapes.
      // The easiest way to do this is to simply go by the previous probability masses.

      // The cache really isn't helpful here, because we would need two separate caches
      let discreteIntegralSum =
        Discrete.T.Integral.sum(~cache=None, discrete);
      let continuousIntegralSum =
        Continuous.T.Integral.sum(~cache=None, continuous);
      let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum;

      // TODO: figure out what to do when the totalIntegralSum is zero.

      let downsampledDiscrete =
        Discrete.T.downsample(
          int_of_float(
            float_of_int(count) *. (discreteIntegralSum /. totalIntegralSum),
          ),
          discrete,
        );

      let downsampledContinuous =
        Continuous.T.downsample(
          int_of_float(
            float_of_int(count) *. (continuousIntegralSum /. totalIntegralSum),
          ),
          continuous,
        );

      {discrete: downsampledDiscrete, continuous: downsampledContinuous};
    };

    let normalizedToContinuous = (t: t) => Some(normalize(t).continuous);

    let normalizedToDiscrete = ({discrete} as t: t) =>
      Some(normalize(t).discrete);

    let integral = (~cache, {continuous, discrete}: t) => {
      switch (cache) {
      | Some(cache) => cache
      | None =>
        // note: if the underlying shapes aren't normalized, then these integrals won't be either!
        let continuousIntegral =
          Continuous.T.Integral.get(~cache=None, continuous);
        let discreteIntegral = Discrete.T.Integral.get(~cache=None, discrete);

        Continuous.make(
          `Linear,
          XYShape.PointwiseCombination.combineLinear(
            ~fn=(+.),
            Continuous.getShape(continuousIntegral),
            Continuous.getShape(discreteIntegral),
          ),
          None,
        );
      };
    };

    let integralEndY = (~cache, t: t) => {
      integral(~cache, t) |> Continuous.lastY;
    };

    let integralXtoY = (~cache, f, t) => {
      t |> integral(~cache) |> Continuous.getShape |> XYShape.XtoY.linear(f);
    };

    let integralYtoX = (~cache, f, t) => {
      t |> integral(~cache) |> Continuous.getShape |> XYShape.YtoX.linear(f);
    };

    // This pipes all ys (continuous and discrete) through fn.
    // If mapY is a linear operation, we might be able to update the knownIntegralSums as well;
    // if not, they'll be set to None.
    let mapY =
        (
          ~knownIntegralSumFn=previousIntegralSum => None,
          fn,
          {discrete, continuous}: t,
        )
        : t => {
      let u = E.O.bind(_, knownIntegralSumFn);

      let yMappedDiscrete =
        discrete
        |> Discrete.T.mapY(fn)
        |> Discrete.updateKnownIntegralSum(u(discrete.knownIntegralSum));

      let yMappedContinuous =
        continuous
        |> Continuous.T.mapY(fn)
        |> Continuous.updateKnownIntegralSum(u(continuous.knownIntegralSum));

      {
        discrete: yMappedDiscrete,
        continuous: Continuous.T.mapY(fn, continuous),
      };
    };

    let mean = ({discrete, continuous}: t): float => {
      let discreteMean = Discrete.T.mean(discrete);
      let continuousMean = Continuous.T.mean(continuous);

      // the combined mean is the weighted sum of the two:
      let discreteIntegralSum =
        Discrete.T.Integral.sum(~cache=None, discrete);
      let continuousIntegralSum =
        Continuous.T.Integral.sum(~cache=None, continuous);
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
      let discreteIntegralSum =
        Discrete.T.Integral.sum(~cache=None, discrete);
      let continuousIntegralSum =
        Continuous.T.Integral.sum(~cache=None, continuous);
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
    (~downsample=false, op: ExpressionTypes.algebraicOperation, t1: t, t2: t)
    : t => {
  // Discrete convolution can cause a huge increase in the number of samples,
  // so we'll first downsample.

  // An alternative (to be explored in the future) may be to first perform the full convolution and then to downsample the result;
  // to use non-uniform fast Fourier transforms (for addition only), add web workers or gpu.js, etc. ...

  let downsampleIfTooLarge = (t: t) => {
    let sqtl = sqrt(float_of_int(totalLength(t)));
    sqtl > 10. && downsample ? T.downsample(int_of_float(sqtl), t) : t;
  };

  let t1d = downsampleIfTooLarge(t1);
  let t2d = downsampleIfTooLarge(t2);

  // continuous (*) continuous => continuous, but also
  // discrete (*) continuous => continuous (and vice versa). We have to take care of all combos and then combine them:
  let ccConvResult =
    Continuous.combineAlgebraically(
      ~downsample=false,
      op,
      t1d.continuous,
      t2d.continuous,
    );
  let dcConvResult =
    Continuous.combineAlgebraicallyWithDiscrete(
      ~downsample=false,
      op,
      t2d.continuous,
      t1d.discrete,
    );
  let cdConvResult =
    Continuous.combineAlgebraicallyWithDiscrete(
      ~downsample=false,
      op,
      t1d.continuous,
      t2d.discrete,
    );
  let continuousConvResult =
    Continuous.reduce((+.), [|ccConvResult, dcConvResult, cdConvResult|]);

  // ... finally, discrete (*) discrete => discrete, obviously:
  let discreteConvResult =
    Discrete.combineAlgebraically(op, t1d.discrete, t2d.discrete);

  {discrete: discreteConvResult, continuous: continuousConvResult};
};
