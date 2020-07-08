open Distributions;

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
let combinePointwise =
    (
      ~knownIntegralSumsFn,
      fn: (float, float) => float,
      t1: DistTypes.continuousShape,
      t2: DistTypes.continuousShape,
    )
    : DistTypes.continuousShape => {
  // If we're adding the distributions, and we know the total of each, then we
  // can just sum them up. Otherwise, all bets are off.
  let combinedIntegralSum =
    Common.combineIntegralSums(
      knownIntegralSumsFn,
      t1.knownIntegralSum,
      t2.knownIntegralSum,
    );

  make(
    `Linear,
    XYShape.PointwiseCombination.combineLinear(
      ~fn=(+.),
      t1.xyShape,
      t2.xyShape,
    ),
    combinedIntegralSum,
  );
};

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
let updateKnownIntegralSum = (knownIntegralSum, t: t): t => {
  ...t,
  knownIntegralSum,
};

let reduce =
    (
      ~knownIntegralSumsFn: (float, float) => option(float)=(_, _) => None,
      fn,
      continuousShapes,
    ) =>
  continuousShapes
  |> E.A.fold_left(combinePointwise(~knownIntegralSumsFn, fn), empty);

let mapY = (~knownIntegralSumFn=_ => None, fn, t: t) => {
  let u = E.O.bind(_, knownIntegralSumFn);
  let yMapFn = shapeMap(XYShape.T.mapY(fn));

  t |> yMapFn |> updateKnownIntegralSum(u(t.knownIntegralSum));
};

let scaleBy = (~scale=1.0, t: t): t => {
  t
  |> mapY((r: float) => r *. scale)
  |> updateKnownIntegralSum(
       E.O.bind(t.knownIntegralSum, v => Some(scale *. v)),
     );
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
          xyShape |> XYShape.XtoY.stepwiseIncremental(f) |> E.O.default(0.0)
        | `Linear => xyShape |> XYShape.XtoY.linear(f)
        }
      )
      |> DistTypes.MixedPoint.makeContinuous;
    };

    let truncate =
        (leftCutoff: option(float), rightCutoff: option(float), t: t) => {
      let lc = E.O.default(neg_infinity, leftCutoff);
      let rc = E.O.default(infinity, rightCutoff);
      let truncatedZippedPairs =
        t
        |> getShape
        |> XYShape.T.zip
        |> XYShape.Zipped.filterByX(x => x >= lc && x <= rc);

      let eps = (t |> getShape |> XYShape.T.xTotalRange) *. 0.0001;

      let leftNewPoint =
        leftCutoff |> E.O.dimap(lc => [|(lc -. eps, 0.)|], _ => [||]);
      let rightNewPoint =
        rightCutoff |> E.O.dimap(rc => [|(rc +. eps, 0.)|], _ => [||]);

      let truncatedZippedPairsWithNewPoints =
        E.A.concatMany([|leftNewPoint, truncatedZippedPairs, rightNewPoint|]);
      let truncatedShape =
        XYShape.T.fromZippedArray(truncatedZippedPairsWithNewPoints);

      make(`Linear, truncatedShape, None);
    };

    // TODO: This should work with stepwise plots.
    let integral = (~cache, t) =>
      if (t |> getShape |> XYShape.T.length > 0) {
        switch (cache) {
        | Some(cache) => cache
        | None =>
          t
          |> getShape
          |> XYShape.Range.integrateWithTriangles
          |> E.O.toExt("This should not have happened")
          |> make(`Linear, _, None)
        };
      } else {
        make(`Linear, {xs: [|neg_infinity|], ys: [|0.0|]}, None);
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
      t
      |> scaleBy(~scale=1. /. integralEndY(~cache=None, t))
      |> updateKnownIntegralSum(Some(1.0));
    };

    let normalizedToContinuous = t => Some(t |> normalize);
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

/* This simply creates multiple copies of the continuous distribution, scaled and shifted according to
   each discrete data point, and then adds them all together. */
let combineAlgebraicallyWithDiscrete =
    (
      ~downsample=false,
      op: ExpressionTypes.algebraicOperation,
      t1: t,
      t2: DistTypes.discreteShape,
    ) => {
  let t1s = t1 |> getShape;
  let t2s = t2.xyShape; // would like to use Discrete.getShape here, but current file structure doesn't allow for that
  let t1n = t1s |> XYShape.T.length;
  let t2n = t2s |> XYShape.T.length;

  let fn = Operation.Algebraic.toFn(op);

  let outXYShapes: array(array((float, float))) =
    Belt.Array.makeUninitializedUnsafe(t2n);

  for (j in 0 to t2n - 1) {
    // for each one of the discrete points
    // create a new distribution, as long as the original continuous one

    let dxyShape: array((float, float)) =
      Belt.Array.makeUninitializedUnsafe(t1n);
    for (i in 0 to t1n - 1) {
      let _ =
        Belt.Array.set(
          dxyShape,
          i,
          (fn(t1s.xs[i], t2s.xs[j]), t1s.ys[i] *. t2s.ys[j]),
        );
      ();
    };

    let _ = Belt.Array.set(outXYShapes, j, dxyShape);
    ();
  };

  let combinedIntegralSum =
    Common.combineIntegralSums(
      (a, b) => Some(a *. b),
      t1.knownIntegralSum,
      t2.knownIntegralSum,
    );

  outXYShapes
  |> E.A.fmap(s => {
       let xyShape = XYShape.T.fromZippedArray(s);
       make(`Linear, xyShape, None);
     })
  |> reduce((+.))
  |> updateKnownIntegralSum(combinedIntegralSum);
};

let combineAlgebraically =
    (~downsample=false, op: ExpressionTypes.algebraicOperation, t1: t, t2: t) => {
  let s1 = t1 |> getShape;
  let s2 = t2 |> getShape;
  let t1n = s1 |> XYShape.T.length;
  let t2n = s2 |> XYShape.T.length;
  if (t1n == 0 || t2n == 0) {
    empty;
  } else {
    let combinedShape =
      AlgebraicShapeCombination.combineShapesContinuousContinuous(op, s1, s2);
    let combinedIntegralSum =
      Common.combineIntegralSums(
        (a, b) => Some(a *. b),
        t1.knownIntegralSum,
        t2.knownIntegralSum,
      );
    // return a new Continuous distribution
    make(`Linear, combinedShape, combinedIntegralSum);
  };
};
