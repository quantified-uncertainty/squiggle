module type dist = {
  type t;
  type integral;
  let minX: t => float;
  let maxX: t => float;
  let mapY: (~knownIntegralSumFn: float => option(float)=?, float => float, t) => t;
  let xToY: (float, t) => DistTypes.mixedPoint;
  let toShape: t => DistTypes.shape;
  let toContinuous: t => option(DistTypes.continuousShape);
  let toDiscrete: t => option(DistTypes.discreteShape);
  let normalize: t => t;
  let normalizedToContinuous: t => option(DistTypes.continuousShape);
  let normalizedToDiscrete: t => option(DistTypes.discreteShape);
  let toDiscreteProbabilityMassFraction: t => float;
  let downsample: (~cache: option(integral)=?, int, t) => t;

  let integral: (~cache: option(integral), t) => integral;
  let integralEndY: (~cache: option(integral), t) => float;
  let integralXtoY: (~cache: option(integral), float, t) => float;
  let integralYtoX: (~cache: option(integral), float, t) => float;

  let mean: t => float;
  let variance: t => float;
};

module Dist = (T: dist) => {
  type t = T.t;
  type integral = T.integral;
  let minX = T.minX;
  let maxX = T.maxX;
  let integral = T.integral;
  let xTotalRange = (t: t) => maxX(t) -. minX(t);
  let mapY = T.mapY;
  let xToY = T.xToY;
  let downsample = T.downsample;
  let toShape = T.toShape;
  let toDiscreteProbabilityMassFraction = T.toDiscreteProbabilityMassFraction;
  let toContinuous = T.toContinuous;
  let toDiscrete = T.toDiscrete;
  let normalize = T.normalize;
  let normalizedToContinuous = T.normalizedToContinuous;
  let normalizedToDiscrete = T.normalizedToDiscrete;
  let mean = T.mean;
  let variance = T.variance;

  module Integral = {
    type t = T.integral;
    let get = T.integral;
    let xToY = T.integralXtoY;
    let yToX = T.integralYtoX;
    let sum = T.integralEndY;
  };
};

module Continuous {
  type t = DistTypes.continuousShape;
  let getShape = (t: t) => t.xyShape;
  let interpolation = (t: t) => t.interpolation;
  let make = (interpolation, xyShape, knownIntegralSum): t => {
    xyShape,
    interpolation,
    knownIntegralSum,
  };
  let shapeMap = (fn, {xyShape, interpolation, knownIntegralSum}: t): t => {
    xyShape: fn(xyShape),
    interpolation,
    knownIntegralSum,
  };
  let lastY = (t: t) => t |> getShape |> XYShape.T.lastY;
  let oShapeMap =
      (fn, {xyShape, interpolation, knownIntegralSum}: t)
      : option(DistTypes.continuousShape) =>
    fn(xyShape) |> E.O.fmap(make(interpolation, _, knownIntegralSum));

  let empty: DistTypes.continuousShape = {
    xyShape: XYShape.T.empty,
    interpolation: `Linear,
    knownIntegralSum: Some(0.0),
  };
  let combine =
      (fn, t1: DistTypes.continuousShape, t2: DistTypes.continuousShape)
      : DistTypes.continuousShape => {

    // If we're adding the distributions, and we know the total of each, then we
    // can just sum them up. Otherwise, all bets are off.
    let combinedIntegralSum =
      switch (fn, t1.knownIntegralSum, t2.knownIntegralSum) {
      | (_, None, _)
      | (_, _, None) => None
      | ((+.), Some(s1), Some(s2)) => Some(s1 +. s2)
      };

    make(
      `Linear,
      XYShape.Combine.combine(
        ~xsSelection=ALL_XS,
        ~xToYSelection=XYShape.XtoY.linear,
        ~fn,
        t1.xyShape,
        t2.xyShape,
      ),
      combinedIntegralSum,
    );
  };
  let reduce = (fn, items) => items |> E.A.fold_left(combine(fn), empty);

  let toLinear = (t: t): option(t) => {
    switch (t) {
    | {interpolation: `Stepwise, xyShape, knownIntegralSum} =>
      xyShape
      |> XYShape.Range.stepsToContinuous
      |> E.O.fmap(make(`Linear, _, knownIntegralSum))
    | {interpolation: `Linear} => Some(t)
    };
  };
  let shapeFn = (fn, t: t) => t |> getShape |> fn;
  let updateKnownIntegralSum = (knownIntegralSum, t: t): t => ({...t, knownIntegralSum});

  // Contracts every point in the continuous xyShape into a single dirac-Delta-like point,
  // using the centerpoints between adjacent xs and the area under each trapezoid.
  // This is essentially like integrateWithTriangles, without the accumulation.
  let toDiscretePointMasses = (t: t): DistTypes.discreteShape => {
    let tl = t |> getShape |> XYShape.T.length;
    let pointMassesY: array(float) = Belt.Array.make(tl - 1, 0.0);
    let {xs, ys}: XYShape.T.t = t |> getShape;
    for (x in 0 to E.A.length(xs) - 2) {
      let _ =
        Belt.Array.set(
          pointMassesY,
          x,
          (xs[x + 1] -. xs[x]) *. ((ys[x] +. ys[x + 1]) /. 2.)); // = dx * (1/2) * (avgY)
      ();
    };

    {xyShape: {xs: xs, ys: pointMassesY}, knownIntegralSum: t.knownIntegralSum};
  };

  /* Performs a discrete convolution between two continuous distributions A and B.
   * It is an extremely good idea to downsample the distributions beforehand,
   * because the number of samples in the convolution can be up to length(A) * length(B).
   *
   * Conventional convolution uses fn = (+.), but we also allow other operations to combine the xs.
   *
   * In practice, the convolution works by multiplying the ys for each possible combo of points of
   * the two shapes. This creates a new shape for each point of A. These new shapes are then combined
   * linearly. This may not always be the most efficient way, but it is probably the most robust for now.
   *
   * In the future, it may be possible to use a non-uniform fast Fourier transform instead (although only for addition).
   */
  let convolveWithDiscrete = (fn, t1: t, t2: DistTypes.discreteShape) => {
    let t1s = t1 |> getShape;
    let t2s = t2.xyShape; // would like to use Discrete.getShape here, but current file structure doesn't allow for that
    let t1n = t1s |> XYShape.T.length;
    let t2n = t2s |> XYShape.T.length;

    let outXYShapes: array(array((float, float))) = Belt.Array.makeUninitializedUnsafe(t1n);

    for (i in 0 to t1n - 1) {
      // create a new distribution
      let dxyShape: array((float, float)) = Belt.Array.makeUninitializedUnsafe(t2n);
      for (j in 0 to t2n - 1) {
        let _ = Belt.Array.set(dxyShape, j, (fn(t1s.xs[i], t2s.xs[j]), t1s.ys[i] *. t2s.ys[j]));
        ();
      }
      let _ = Belt.Array.set(outXYShapes, i, dxyShape);
      ();
    }

    let combinedIntegralSum =
      switch (t1.knownIntegralSum, t2.knownIntegralSum) {
      | (None, _)
      | (_, None) => None
      | (Some(s1), Some(s2)) => Some(s1 *. s2)
      };

    outXYShapes
    |> E.A.fmap(s => {
          let xyShape = XYShape.T.fromZippedArray(s);
          make(`Linear, xyShape, None);
        })
    |> reduce((+.))
    |> updateKnownIntegralSum(combinedIntegralSum);
  };

  let convolve = (fn, t1: t, t2: t) =>
    convolveWithDiscrete(fn, t1, toDiscretePointMasses(t2));

  let mapY = (~knownIntegralSumFn=(previousKnownIntegralSum => None), fn, t: t) => {
    let u = E.O.bind(_, knownIntegralSumFn);
    let yMapFn = shapeMap(XYShape.T.mapY(fn));

    t |> yMapFn |> updateKnownIntegralSum(u(t.knownIntegralSum));
  };

  let scaleBy = (~scale=1.0, ~knownIntegralSum=None, t: t): t =>
    t |> mapY((r: float) => r *. scale) |> updateKnownIntegralSum(knownIntegralSum);

  let truncate = (leftCutoff: option(float), rightCutoff: option(float), t: t) => {
    let truncatedZippedPairs =
      t
      |> getShape
      |> XYShape.T.zip
      |> XYShape.Zipped.filterByX(x => x >= E.O.default(neg_infinity, leftCutoff) || x <= E.O.default(infinity, rightCutoff));

    let eps = (t |> getShape |> XYShape.T.xTotalRange) *. 0.0001;

    let leftNewPoint = leftCutoff |> E.O.dimap(lc => [| (lc -. eps, 0.) |], _ => [||]);
    let rightNewPoint = rightCutoff |> E.O.dimap(rc => [| (rc +. eps, 0.) |], _ => [||]);

    let truncatedZippedPairsWithNewPoints =
      E.A.concatMany([| leftNewPoint, truncatedZippedPairs, rightNewPoint |]);
    let truncatedShape = XYShape.T.fromZippedArray(truncatedZippedPairsWithNewPoints);
   
    make(`Linear, truncatedShape, None);
  };

  module T =
    Dist({
      type t = DistTypes.continuousShape;
      type integral = DistTypes.continuousShape;
      let minX = shapeFn(XYShape.T.minX);
      let maxX = shapeFn(XYShape.T.maxX);
      let mapY = mapY;
      let toDiscreteProbabilityMassFraction = _ => 0.0;
      let toShape = (t: t): DistTypes.shape => Continuous(t);
      let xToY = (f, {interpolation, xyShape}: t) => {
        (
          switch (interpolation) {
          | `Stepwise =>
            xyShape
            |> XYShape.XtoY.stepwiseIncremental(f)
            |> E.O.default(0.0)
          | `Linear => xyShape |> XYShape.XtoY.linear(f)
          }
        )
        |> DistTypes.MixedPoint.makeContinuous;
      };

      // let combineWithFn = (t1: t, t2: t, fn: (float, float) => float) => {
      //   switch(t1, t2){
      //     | ({interpolation: `Stepwise}, {interpolation: `Stepwise}) => 3.0
      //     | ({interpolation: `Linear}, {interpolation: `Linear}) => 3.0
      //   }
      // };

      // TODO: This should work with stepwise plots.
      let integral = (~cache, t) =>
        switch (cache) {
        | Some(cache) => cache
        | None =>
          t
          |> getShape
          |> XYShape.Range.integrateWithTriangles
          |> E.O.toExt("This should not have happened")
          |> make(`Linear, _, None)
        };
      let downsample = (~cache=None, length, t): t =>
        t
        |> shapeMap(
             XYShape.XsConversion.proportionByProbabilityMass(
               length,
               integral(~cache, t).xyShape,
             ),
           );
      let integralEndY = (~cache, t: t) =>
        t.knownIntegralSum |> E.O.default(t |> integral(~cache) |> lastY);
      let integralXtoY = (~cache, f, t: t) =>
        t |> integral(~cache) |> shapeFn(XYShape.XtoY.linear(f));
      let integralYtoX = (~cache, f, t: t) =>
        t |> integral(~cache) |> shapeFn(XYShape.YtoX.linear(f));
      let toContinuous = t => Some(t);
      let toDiscrete = _ => None;

      let normalize = (t: t): t => {
        let continuousIntegralSum = integralEndY(~cache=None, t);

        scaleBy(~scale=(1. /. continuousIntegralSum), ~knownIntegralSum=Some(1.0), t);
      };

      let normalizedToContinuous = t => Some(t); // TODO: this should be normalized
      let normalizedToDiscrete = _ => None;

      let mean = (t: t) => {
        let indefiniteIntegralStepwise = (p, h1) => h1 *. p ** 2.0 /. 2.0;
        let indefiniteIntegralLinear = (p, a, b) =>
          a *. p ** 2.0 /. 2.0 +. b *. p ** 3.0 /. 3.0;
        XYShape.Analysis.integrateContinuousShape(
          ~indefiniteIntegralStepwise,
          ~indefiniteIntegralLinear,
          t,
        );
      };
      let variance = (t: t): float =>
        XYShape.Analysis.getVarianceDangerously(
          t,
          mean,
          XYShape.Analysis.getMeanOfSquaresContinuousShape,
        );
    });
};

module Discrete = {
  type t = DistTypes.discreteShape;

  let make = (xyShape, knownIntegralSum): t => {xyShape, knownIntegralSum};
  let shapeMap = (fn, {xyShape, knownIntegralSum}: t): t => {
    xyShape: fn(xyShape),
    knownIntegralSum,
  };
  let getShape = (t: t) => t.xyShape;
  let oShapeMap = (fn, {xyShape, knownIntegralSum}: t): option(t) =>
    fn(xyShape) |> E.O.fmap(make(_, knownIntegralSum));

  let empty: t = {xyShape: XYShape.T.empty, knownIntegralSum: Some(0.0)};
  let shapeFn = (fn, t: t) => t |> getShape |> fn;

  let lastY = (t: t) => t |> getShape |> XYShape.T.lastY;

  let combineIntegralSums = (combineFn: ((float, float) => option(float)), t1KnownIntegralSum: option(float), t2KnownIntegralSum: option(float)) => {
    switch (t1KnownIntegralSum, t2KnownIntegralSum) {
    | (None, _)
    | (_, None) => None
    | (Some(s1), Some(s2)) => combineFn(s1, s2)
    };
  };

  let combine = (combineIntegralSumsFn, fn, t1: DistTypes.discreteShape, t2: DistTypes.discreteShape)
      : DistTypes.discreteShape => {

    let combinedIntegralSum = combineIntegralSums(combineIntegralSumsFn, t1.knownIntegralSum, t2.knownIntegralSum);

    make(
      XYShape.Combine.combine(
        ~xsSelection=ALL_XS,
        ~xToYSelection=XYShape.XtoY.stepwiseIfAtX,
        ~fn,  // stepwiseIfAtX returns option(float), so this fn needs to handle None, which is what the _default0 wrapper is for
        t1.xyShape,
        t2.xyShape,
      ),
      combinedIntegralSum,
    );
  };
  let _default0 = (fn, a, b) =>
    fn(E.O.default(0.0, a), E.O.default(0.0, b));
  let reduce = (fn, items) =>
    items |> E.A.fold_left(combine((_, _) => None, _default0(fn)), empty);
  // a special version of reduce that adds the results (which should be the most common case by far),
  // and conveniently also adds the knownIntegralSums.
  let reduceAdd = (fn, items) =>
    items |> E.A.fold_left(combine((s1, s2) => Some(s1 +. s2), _default0((+.))), empty);

  let updateKnownIntegralSum = (knownIntegralSum, t: t): t => ({...t, knownIntegralSum});

  let convolve = (fn, t1: t, t2: t) => {
    let t1s = t1 |> getShape;
    let t2s = t2 |> getShape;
    let t1n = t1s |> XYShape.T.length;
    let t2n = t2s |> XYShape.T.length;

    let combinedIntegralSum = combineIntegralSums((s1, s2) => Some(s1 *. s2), t1.knownIntegralSum, t2.knownIntegralSum);

    let xToYMap = E.FloatFloatMap.empty();

    for (i in 0 to t1n - 1) {
      for (j in 0 to t2n - 1) {
        let x = fn(t1s.xs[i], t2s.xs[j]);
        let cv = xToYMap |> E.FloatFloatMap.get(x) |> E.O.default(0.);
        let my = t1s.ys[i] *. t2s.ys[j];
        let _ = Belt.MutableMap.set(xToYMap, x, cv +. my);
        ();
      }
    }

    let rxys = xToYMap |> E.FloatFloatMap.toArray |> XYShape.Zipped.sortByX;

    let convolvedShape = XYShape.T.fromZippedArray(rxys);

    make(convolvedShape, combinedIntegralSum);
  };

  let mapY = (~knownIntegralSumFn=(previousKnownIntegralSum => None), fn, t: t) => {
    let u = E.O.bind(_, knownIntegralSumFn);
    let yMapFn = shapeMap(XYShape.T.mapY(fn));

    t |> yMapFn |> updateKnownIntegralSum(u(t.knownIntegralSum));
  };

  let scaleBy = (~scale=1.0, ~knownIntegralSum=None, t: t): t =>
    t |> mapY((r: float) => r *. scale) |> updateKnownIntegralSum(knownIntegralSum);

  let truncate = (leftCutoff: option(float), rightCutoff: option(float), t: t) => {
    let truncatedShape =
      t
      |> getShape
      |> XYShape.T.zip
      |> XYShape.Zipped.filterByX(x => x >= E.O.default(neg_infinity, leftCutoff) || x <= E.O.default(infinity, rightCutoff))
      |> XYShape.T.fromZippedArray;

    make(truncatedShape, None);
  };

  module T =
    Dist({
      type t = DistTypes.discreteShape;
      type integral = DistTypes.continuousShape;
      let integral = (~cache, t) =>
        switch (cache) {
        | Some(c) => c
        | None =>
          Continuous.make(
            `Stepwise,
            XYShape.T.accumulateYs((+.), getShape(t)),
            None,
          )
        };
      let integralEndY = (~cache, t: t) =>
        t.knownIntegralSum |> E.O.default(t |> integral(~cache) |> Continuous.lastY);
      let minX = shapeFn(XYShape.T.minX);
      let maxX = shapeFn(XYShape.T.maxX);
      let toDiscreteProbabilityMassFraction = _ => 1.0;
      let mapY = mapY;
      let toShape = (t: t): DistTypes.shape => Discrete(t);
      let toContinuous = _ => None;
      let toDiscrete = t => Some(t);

      let normalize = (t: t): t => {
        let discreteIntegralSum = integralEndY(~cache=None, t);

        scaleBy(~scale=(1. /. discreteIntegralSum), ~knownIntegralSum=Some(1.0), t);
      };

      let normalizedToContinuous = _ => None;
      let normalizedToDiscrete = t => Some(t); // TODO: this should be normalized!

      let downsample = (~cache=None, i, t: t): t => {
        // It's not clear how to downsample a set of discrete points in a meaningful way.
        // The best we can do is to clip off the smallest values.
        let clippedShape =
          t
          |> getShape
          |> XYShape.T.zip
          |> XYShape.Zipped.sortByY
          |> Belt.Array.reverse
          |> Belt.Array.slice(_, ~offset=0, ~len=i)
          |> XYShape.Zipped.sortByX
          |> XYShape.T.fromZippedArray;

        make(clippedShape, None); // if someone needs the sum, they'll have to recompute it
      };

      let xToY = (f, t) =>
        t
        |> getShape
        |> XYShape.XtoY.stepwiseIfAtX(f)
        |> E.O.default(0.0)
        |> DistTypes.MixedPoint.makeDiscrete;

      let integralXtoY = (~cache, f, t) =>
        t
        |> integral(~cache)
        |> Continuous.getShape
        |> XYShape.XtoY.linear(f);

      let integralYtoX = (~cache, f, t) =>
        t
        |> integral(~cache)
        |> Continuous.getShape
        |> XYShape.YtoX.linear(f);

      let mean = (t: t): float => {
        let s = getShape(t);
        E.A.reducei(s.xs, 0.0, (acc, x, i) => acc +. x *. s.ys[i]);
      };
      let variance = (t: t): float => {
        let getMeanOfSquares = t =>
          t |> shapeMap(XYShape.Analysis.squareXYShape) |> mean;
        XYShape.Analysis.getVarianceDangerously(t, mean, getMeanOfSquares);
      };
    });

};

// TODO: I think this shouldn't assume continuous/discrete are normalized to 1.0, and thus should not need the discreteProbabilityMassFraction being separate.
module Mixed = {
  type t = DistTypes.mixedShape;
  let make = (~continuous, ~discrete): t => {
    continuous,
    discrete,
  };

  let totalLength = (t: t): int => {
    let continuousLength = t.continuous |> Continuous.getShape |> XYShape.T.length;
    let discreteLength = t.discrete |> Discrete.getShape |> XYShape.T.length;

    continuousLength + discreteLength;
  };

  // TODO: Put into scaling module
  //let normalizeMixedPoint = (t, f) => f *. discreteProbabilityMassFraction;*/

  //TODO: Warning: This currently computes the integral, which is expensive.
  /*let scaleContinuousFn =
      ({discreteProbabilityMassFraction}: DistTypes.mixedShape, f) =>
    f *. (1.0 -. discreteProbabilityMassFraction); */

  //TODO: Warning: This currently computes the integral, which is expensive.

  // Normalizes to 1.0.
  /*let scaleContinuous = ({discreteProbabilityMassFraction}: t, continuous) =>
     // get only the continuous, and scale it to the respective
      continuous
      |> Continuous.T.scaleToIntegralSum(
           ~intendedSum=1.0 -. discreteProbabilityMassFraction,
         );

    let scaleDiscrete = ({discreteProbabilityMassFraction}: t, disrete) =>
      disrete
      |> Discrete.T.scaleToIntegralSum(
           ~intendedSum=discreteProbabilityMassFraction,
         );*/

  let truncate = (leftCutoff: option(float), rightCutoff: option(float), {discrete, continuous}: t) => {
    let truncatedDiscrete = Discrete.truncate(leftCutoff, rightCutoff, discrete);
    let truncatedContinuous = Continuous.truncate(leftCutoff, rightCutoff, continuous);

    make(~discrete=truncatedDiscrete, ~continuous=truncatedContinuous);
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
      let toContinuous = ({continuous}: t) => Some(continuous);
      let toDiscrete = ({discrete}: t) => Some(discrete);

      let normalize = (t: t): t => {
        let continuousIntegralSum = Continuous.T.Integral.sum(~cache=None, t.continuous);
        let discreteIntegralSum = Discrete.T.Integral.sum(~cache=None, t.discrete);
        let totalIntegralSum = continuousIntegralSum +. discreteIntegralSum;

        let newContinuousSum = continuousIntegralSum /. totalIntegralSum;
        let newDiscreteSum = discreteIntegralSum /. totalIntegralSum;

        let normalizedContinuous = Continuous.scaleBy(~scale=(1. /. newContinuousSum), ~knownIntegralSum=Some(newContinuousSum), t.continuous);
        let normalizedDiscrete = Discrete.scaleBy(~scale=(1. /. newDiscreteSum), ~knownIntegralSum=Some(newDiscreteSum), t.discrete);

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
        let discreteIntegralSum = Discrete.T.Integral.sum(~cache=None, discrete);
        let continuousIntegralSum = Continuous.T.Integral.sum(~cache=None, continuous);
        let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum;

        discreteIntegralSum /. totalIntegralSum;
      };

      let downsample = (~cache=None, count, {discrete, continuous}: t): t => {
        // We will need to distribute the new xs fairly between the discrete and continuous shapes.
        // The easiest way to do this is to simply go by the previous probability masses.

        // The cache really isn't helpful here, because we would need two separate caches
        let discreteIntegralSum = Discrete.T.Integral.sum(~cache=None, discrete);
        let continuousIntegralSum = Continuous.T.Integral.sum(~cache=None, continuous);
        let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum;

        let downsampledDiscrete =
          Discrete.T.downsample(
            int_of_float(float_of_int(count) *. (discreteIntegralSum /. totalIntegralSum)),
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

    let normalizedToContinuous = (t: t) =>
      Some(normalize(t).continuous);

    let normalizedToDiscrete = ({discrete} as t: t) =>
      Some(normalize(t).discrete);

      let integral =
          (
            ~cache,
            {continuous, discrete}: t,
          ) => {
        switch (cache) {
        | Some(cache) => cache
        | None => {
          // note: if the underlying shapes aren't normalized, then these integrals won't be either!
          let continuousIntegral = Continuous.T.Integral.get(~cache=None, continuous);
          let discreteIntegral = Discrete.T.Integral.get(~cache=None, discrete);

          Continuous.make(
            `Linear,
            XYShape.Combine.combineLinear(
              ~fn=(+.),
              Continuous.getShape(continuousIntegral),
              Continuous.getShape(discreteIntegral),
            ),
            None,
          );
        }
        };
      };

      let integralEndY = (~cache, t: t) => {
        integral(~cache, t) |> Continuous.lastY;
      };

      let integralXtoY = (~cache, f, t) => {
        t
        |> integral(~cache)
        |> Continuous.getShape
        |> XYShape.XtoY.linear(f);
      };

      let integralYtoX = (~cache, f, t) => {
        t
        |> integral(~cache)
        |> Continuous.getShape
        |> XYShape.YtoX.linear(f);
      };

      // This pipes all ys (continuous and discrete) through fn.
      // If mapY is a linear operation, we might be able to update the knownIntegralSums as well;
      // if not, they'll be set to None.
      let mapY = (~knownIntegralSumFn=(previousIntegralSum => None), fn, {discrete, continuous}: t): t => {
        let u = E.O.bind(_, knownIntegralSumFn);

        let yMappedDiscrete =
          discrete |> Discrete.T.mapY(fn) |> Discrete.updateKnownIntegralSum(u(discrete.knownIntegralSum));

        let yMappedContinuous =
          continuous |> Continuous.T.mapY(fn) |> Continuous.updateKnownIntegralSum(u(continuous.knownIntegralSum));

        {
          discrete: yMappedDiscrete,
          continuous: Continuous.T.mapY(fn, continuous),
        };
      };

      let mean = ({discrete, continuous}: t): float => {
        let discreteMean = Discrete.T.mean(discrete);
        let continuousMean = Continuous.T.mean(continuous);

        // the combined mean is the weighted sum of the two:
        let discreteIntegralSum = Discrete.T.Integral.sum(~cache=None, discrete);
        let continuousIntegralSum = Continuous.T.Integral.sum(~cache=None, continuous);
        let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum;

        (discreteMean *. discreteIntegralSum +. continuousMean *. continuousIntegralSum) /. totalIntegralSum;
      };

      let variance = ({discrete, continuous} as t: t): float => {
        // the combined mean is the weighted sum of the two:
        let discreteIntegralSum = Discrete.T.Integral.sum(~cache=None, discrete);
        let continuousIntegralSum = Continuous.T.Integral.sum(~cache=None, continuous);
        let totalIntegralSum = discreteIntegralSum +. continuousIntegralSum;

        let getMeanOfSquares = ({discrete, continuous} as t: t) => {
          let discreteMean = discrete |> Discrete.shapeMap(XYShape.Analysis.squareXYShape) |> Discrete.T.mean;
          let continuousMean = continuous |> XYShape.Analysis.getMeanOfSquaresContinuousShape;
          (discreteMean *. discreteIntegralSum +. continuousMean *. continuousIntegralSum) /. totalIntegralSum
        };

        switch (discreteIntegralSum /. totalIntegralSum) {
        | 1.0 => Discrete.T.variance(discrete)
        | 0.0 => Continuous.T.variance(continuous)
        | _ => XYShape.Analysis.getVarianceDangerously(t, mean, getMeanOfSquares)
        };
      };
    });

  let convolve = (fn: ((float, float) => float), t1: t, t2: t): t => {
    // Discrete convolution can cause a huge increase in the number of samples,
    // so we'll first downsample.

    // An alternative (to be explored in the future) may be to first perform the full convolution and then to downsample the result;
    // to use non-uniform fast Fourier transforms (for addition only), add web workers or gpu.js, etc. ...

    // TODO: make this optional or customizable
    let downsampleIfTooLarge = (t: t) => {
      let sqtl = sqrt(float_of_int(totalLength(t)));
      sqtl > 10. ? T.downsample(int_of_float(sqtl), t) : t;
    };

    let t1d = downsampleIfTooLarge(t1);
    let t2d = downsampleIfTooLarge(t2);

    // continuous (*) continuous => continuous, but also
    // discrete (*) continuous => continuous (and vice versa). We have to take care of all combos and then combine them:
    let ccConvResult = Continuous.convolve(fn, t1d.continuous, t2d.continuous);
    let dcConvResult = Continuous.convolveWithDiscrete(fn, t2d.continuous, t1d.discrete);
    let cdConvResult = Continuous.convolveWithDiscrete(fn, t1d.continuous, t2d.discrete);
    let continuousConvResult = Continuous.reduce((+.), [|ccConvResult, dcConvResult, cdConvResult|]);

    // ... finally, discrete (*) discrete => discrete, obviously:
    let discreteConvResult = Discrete.convolve(fn, t1d.discrete, t2d.discrete);

    {discrete: discreteConvResult, continuous: continuousConvResult};
  }
};

module Shape = {
  type t = DistTypes.shape;
  let mapToAll = ((fn1, fn2, fn3), t: t) =>
    switch (t) {
    | Mixed(m) => fn1(m)
    | Discrete(m) => fn2(m)
    | Continuous(m) => fn3(m)
    };

  let fmap = ((fn1, fn2, fn3), t: t): t =>
    switch (t) {
    | Mixed(m) => Mixed(fn1(m))
    | Discrete(m) => Discrete(fn2(m))
    | Continuous(m) => Continuous(fn3(m))
    };

  let toMixed = mapToAll((
    m => m,
    d => Mixed.make(~discrete=d, ~continuous=Continuous.empty),
    c => Mixed.make(~discrete=Discrete.empty, ~continuous=c),
  ));

  let convolve = (fn, t1: t, t2: t): t => {
    Mixed(Mixed.convolve(fn, toMixed(t1), toMixed(t2)));
  };

  let downsample = (~cache=None, i, t) =>
    fmap((
      Mixed.T.downsample(i),
      Discrete.T.downsample(i),
      Continuous.T.downsample(i),
    ), t);

  let normalize =
    fmap((
      Mixed.T.normalize,
      Discrete.T.normalize,
      Continuous.T.normalize,
    ));

  let truncate (leftCutoff, rightCutoff, t): t =
    fmap((
      Mixed.truncate(leftCutoff, rightCutoff),
      Discrete.truncate(leftCutoff, rightCutoff),
      Continuous.truncate(leftCutoff, rightCutoff),
    ), t);

  module T =
    Dist({
      type t = DistTypes.shape;
      type integral = DistTypes.continuousShape;


      let xToY = (f: float) =>
        mapToAll((
          Mixed.T.xToY(f),
          Discrete.T.xToY(f),
          Continuous.T.xToY(f),
        ));

      let toShape = (t: t) => t;

      let toContinuous = t => None;
      let toDiscrete = t => None;
    let downsample = (~cache=None, i, t) => t;
    let toDiscreteProbabilityMassFraction = t => 0.0;
    let normalize = t => t;
      let toContinuous =
        mapToAll((
          Mixed.T.toContinuous,
          Discrete.T.toContinuous,
          Continuous.T.toContinuous,
        ));
      let toDiscrete =
        mapToAll((
          Mixed.T.toDiscrete,
          Discrete.T.toDiscrete,
          Continuous.T.toDiscrete,
        ));

      let toDiscreteProbabilityMassFraction =
        mapToAll((
          Mixed.T.toDiscreteProbabilityMassFraction,
          Discrete.T.toDiscreteProbabilityMassFraction,
          Continuous.T.toDiscreteProbabilityMassFraction,
        ));

      let normalizedToDiscrete =
        mapToAll((
          Mixed.T.normalizedToDiscrete,
          Discrete.T.normalizedToDiscrete,
          Continuous.T.normalizedToDiscrete,
        ));
      let normalizedToContinuous =
        mapToAll((
          Mixed.T.normalizedToContinuous,
          Discrete.T.normalizedToContinuous,
          Continuous.T.normalizedToContinuous,
        ));
      let minX = mapToAll((Mixed.T.minX, Discrete.T.minX, Continuous.T.minX));
      let integral = (~cache) => {
        mapToAll((
          Mixed.T.Integral.get(~cache),
          Discrete.T.Integral.get(~cache),
          Continuous.T.Integral.get(~cache),
        ));
      };
      let integralEndY = (~cache) =>
        mapToAll((
          Mixed.T.Integral.sum(~cache),
          Discrete.T.Integral.sum(~cache),
          Continuous.T.Integral.sum(~cache),
        ));
      let integralXtoY = (~cache, f) => {
        mapToAll((
          Mixed.T.Integral.xToY(~cache, f),
          Discrete.T.Integral.xToY(~cache, f),
          Continuous.T.Integral.xToY(~cache, f),
        ));
      };
      let integralYtoX = (~cache, f) => {
        mapToAll((
          Mixed.T.Integral.yToX(~cache, f),
          Discrete.T.Integral.yToX(~cache, f),
          Continuous.T.Integral.yToX(~cache, f),
        ));
      };
      let maxX = mapToAll((Mixed.T.maxX, Discrete.T.maxX, Continuous.T.maxX));
      let mapY = (~knownIntegralSumFn=(previousIntegralSum => None), fn) =>
        fmap((
          Mixed.T.mapY(~knownIntegralSumFn, fn),
          Discrete.T.mapY(~knownIntegralSumFn, fn),
          Continuous.T.mapY(~knownIntegralSumFn, fn),
        ));

      let mean = (t: t): float =>
        switch (t) {
        | Mixed(m) => Mixed.T.mean(m)
        | Discrete(m) => Discrete.T.mean(m)
        | Continuous(m) => Continuous.T.mean(m)
        };

      let variance = (t: t): float =>
        switch (t) {
        | Mixed(m) => Mixed.T.variance(m)
        | Discrete(m) => Discrete.T.variance(m)
        | Continuous(m) => Continuous.T.variance(m)
        };
    });
};

module DistPlus = {
  open DistTypes;

  type t = DistTypes.distPlus;

  let shapeIntegral = shape => Shape.T.Integral.get(~cache=None, shape);
  let make =
      (
        ~shape,
        ~guesstimatorString,
        ~domain=Complete,
        ~unit=UnspecifiedDistribution,
        (),
      )
      : t => {
    let integral = shapeIntegral(shape);
    {shape, domain, integralCache: integral, unit, guesstimatorString};
  };

  let update =
      (
        ~shape=?,
        ~integralCache=?,
        ~domain=?,
        ~unit=?,
        ~guesstimatorString=?,
        t: t,
      ) => {
    shape: E.O.default(t.shape, shape),
    integralCache: E.O.default(t.integralCache, integralCache),
    domain: E.O.default(t.domain, domain),
    unit: E.O.default(t.unit, unit),
    guesstimatorString: E.O.default(t.guesstimatorString, guesstimatorString),
  };

  let updateShape = (shape, t) => {
    let integralCache = shapeIntegral(shape);
    update(~shape, ~integralCache, t);
  };

  let domainIncludedProbabilityMass = (t: t) =>
    Domain.includedProbabilityMass(t.domain);

  let domainIncludedProbabilityMassAdjustment = (t: t, f) =>
    f *. Domain.includedProbabilityMass(t.domain);

  let toShape = ({shape, _}: t) => shape;

  let shapeFn = (fn, {shape}: t) => fn(shape);

  module T =
    Dist({
      type t = DistTypes.distPlus;
      type integral = DistTypes.distPlus;
      let toShape = toShape;
      let toContinuous = shapeFn(Shape.T.toContinuous);
      let toDiscrete = shapeFn(Shape.T.toDiscrete);

      let normalize = (t: t): t => {
        let normalizedShape =
          t |> toShape |> Shape.T.normalize;

          t |> updateShape(normalizedShape);

        // TODO: also adjust for domainIncludedProbabilityMass here.
      };

      // TODO: replace this with
      let normalizedToContinuous = (t: t) => {
        t
        |> toShape
        |> Shape.T.normalizedToContinuous
        |> E.O.fmap(
             Continuous.T.mapY(domainIncludedProbabilityMassAdjustment(t)),
           );
      };

      let normalizedToDiscrete = (t: t) => {
        t
        |> toShape
        |> Shape.T.normalizedToDiscrete
        |> E.O.fmap(
             Discrete.T.mapY(domainIncludedProbabilityMassAdjustment(t)),
           );
      };

      let xToY = (f, t: t) =>
        t
        |> toShape
        |> Shape.T.xToY(f)
        |> MixedPoint.fmap(domainIncludedProbabilityMassAdjustment(t));

      let minX = shapeFn(Shape.T.minX);
      let maxX = shapeFn(Shape.T.maxX);
      let toDiscreteProbabilityMassFraction =
        shapeFn(Shape.T.toDiscreteProbabilityMassFraction);

      // This bit is kind of awkward, could probably use rethinking.
      let integral = (~cache, t: t) =>
        updateShape(Continuous(t.integralCache), t);

      let downsample = (~cache=None, i, t): t =>
        updateShape(t |> toShape |> Shape.T.downsample(i), t);
      // todo: adjust for limit, maybe?
      let mapY = (~knownIntegralSumFn=(previousIntegralSum => None), fn, {shape, _} as t: t): t =>
        Shape.T.mapY(~knownIntegralSumFn, fn, shape) |> updateShape(_, t);

      let integralEndY = (~cache as _, t: t) =>
        Shape.T.Integral.sum(~cache=Some(t.integralCache), toShape(t));

      //   TODO: Fix this below, obviously. Adjust for limits
      let integralXtoY = (~cache as _, f, t: t) => {
        Shape.T.Integral.xToY(~cache=Some(t.integralCache), f, toShape(t))
        |> domainIncludedProbabilityMassAdjustment(t);
      };

      // TODO: This part is broken when there is a limit, if this is supposed to be taken into account.
      let integralYtoX = (~cache as _, f, t: t) => {
        Shape.T.Integral.yToX(~cache=Some(t.integralCache), f, toShape(t));
      };
      let mean = (t: t) => Shape.T.mean(t.shape);
      let variance = (t: t) => Shape.T.variance(t.shape);
    });
};

module DistPlusTime = {
  open DistTypes;

  type t = DistTypes.distPlus;

  let unitToJson = ({unit}: t) => unit |> DistTypes.DistributionUnit.toJson;

  let timeVector = ({unit}: t) =>
    switch (unit) {
    | TimeDistribution(timeVector) => Some(timeVector)
    | UnspecifiedDistribution => None
    };

  let timeInVectorToX = (f: TimeTypes.timeInVector, t: t) => {
    let timeVector = t |> timeVector;
    timeVector |> E.O.fmap(TimeTypes.RelativeTimePoint.toXValue(_, f));
  };

  let xToY = (f: TimeTypes.timeInVector, t: t) => {
    timeInVectorToX(f, t) |> E.O.fmap(DistPlus.T.xToY(_, t));
  };

  module Integral = {
    include DistPlus.T.Integral;
    let xToY = (f: TimeTypes.timeInVector, t: t) => {
      timeInVectorToX(f, t)
      |> E.O.fmap(x => DistPlus.T.Integral.xToY(~cache=None, x, t));
    };
  };
};
