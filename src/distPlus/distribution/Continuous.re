open Distributions;

type t = DistTypes.continuousShape;
let getShape = (t: t) => t.xyShape;
let interpolation = (t: t) => t.interpolation;
let make = (interpolation, xyShape, integralSumCache, integralCache): t => {
  xyShape,
  interpolation,
  integralSumCache,
  integralCache,
};
let shapeMap = (fn, {xyShape, interpolation, integralSumCache, integralCache}: t): t => {
  xyShape: fn(xyShape),
  interpolation,
  integralSumCache,
  integralCache,
};
let lastY = (t: t) => t |> getShape |> XYShape.T.lastY;
let oShapeMap =
    (fn, {xyShape, interpolation, integralSumCache, integralCache}: t)
    : option(DistTypes.continuousShape) =>
  fn(xyShape) |> E.O.fmap(make(interpolation, _, integralSumCache, integralCache));

let emptyIntegral: DistTypes.continuousShape = {
  xyShape: {xs: [|neg_infinity|], ys: [|0.0|]},
  interpolation: `Linear,
  integralSumCache: Some(0.0),
  integralCache: None,
};
let empty: DistTypes.continuousShape = {
  xyShape: XYShape.T.empty,
  interpolation: `Linear,
  integralSumCache: Some(0.0),
  integralCache: Some(emptyIntegral),
};

let stepwiseToLinear = (t: t): t =>
  make(`Linear, XYShape.Range.stepwiseToLinear(t.xyShape), t.integralSumCache, t.integralCache);

let combinePointwise =
    (
      ~integralSumCachesFn=(_, _) => None,
      ~integralCachesFn: (t, t) => option(t) =(_, _) => None,
      ~extrapolation=`UseZero,
      fn: (float, float) => float,
      t1: DistTypes.continuousShape,
      t2: DistTypes.continuousShape,
    )
    : DistTypes.continuousShape => {
  // If we're adding the distributions, and we know the total of each, then we
  // can just sum them up. Otherwise, all bets are off.
  let combinedIntegralSum =
    Common.combineIntegralSums(
      integralSumCachesFn,
      t1.integralSumCache,
      t2.integralSumCache,
    );

  // TODO: does it ever make sense to pointwise combine the integrals here?
  // It could be done for pointwise additions, but is that ever needed?

  // If combining stepwise and linear, we must convert the stepwise to linear first,
  // i.e. add a point at the bottom of each step
  let (t1, t2) = switch (t1.interpolation, t2.interpolation) {
  | (`Linear, `Linear) => (t1, t2);
  | (`Stepwise, `Stepwise) => (t1, t2);
  | (`Linear, `Stepwise) => (t1, stepwiseToLinear(t2));
  | (`Stepwise, `Linear) => (stepwiseToLinear(t1), t2);
  };

  let interpolator = XYShape.XtoY.continuousInterpolator(t1.interpolation, extrapolation);

  make(
    `Linear,
    XYShape.PointwiseCombination.combine(
      (+.),
      interpolator,
      interpolator,
      t1.xyShape,
      t2.xyShape,
    ),
    combinedIntegralSum,
    None,
  );
};

let toLinear = (t: t): option(t) => {
  switch (t) {
  | {interpolation: `Stepwise, xyShape, integralSumCache, integralCache} =>
    xyShape
    |> XYShape.Range.stepsToContinuous
    |> E.O.fmap(make(`Linear, _, integralSumCache, integralCache))
  | {interpolation: `Linear} => Some(t)
  };
};
let shapeFn = (fn, t: t) => t |> getShape |> fn;

let updateIntegralSumCache = (integralSumCache, t: t): t => {
  ...t,
  integralSumCache,
};

let updateIntegralCache = (integralCache, t: t): t => {
  ...t,
  integralCache,
};

let reduce =
    (
      ~integralSumCachesFn: (float, float) => option(float)=(_, _) => None,
      ~integralCachesFn: (t, t) => option(t)=(_, _) => None,
      fn,
      continuousShapes,
    ) =>
  continuousShapes
  |> E.A.fold_left(combinePointwise(~integralSumCachesFn, ~integralCachesFn, fn), empty);

let mapY = (~integralSumCacheFn=_ => None,
            ~integralCacheFn=_ => None,
            fn, t: t) => {
  let yMapFn = shapeMap(XYShape.T.mapY(fn));

  t
  |> yMapFn
  |> updateIntegralSumCache(E.O.bind(t.integralSumCache, integralSumCacheFn))
  |> updateIntegralCache(E.O.bind(t.integralCache, integralCacheFn));
};

let rec scaleBy = (~scale=1.0, t: t): t => {
  let scaledIntegralSumCache = E.O.bind(t.integralSumCache, v => Some(scale *. v));
  let scaledIntegralCache = E.O.bind(t.integralCache, v => Some(scaleBy(~scale, v)));

  t
  |> mapY((r: float) => r *. scale)
  |> updateIntegralSumCache(scaledIntegralSumCache)
  |> updateIntegralCache(scaledIntegralCache)
};

module T =
  Dist({
    type t = DistTypes.continuousShape;
    type integral = DistTypes.continuousShape;
    let minX = shapeFn(XYShape.T.minX);
    let maxX = shapeFn(XYShape.T.maxX);
    let mapY = mapY;
    let updateIntegralCache = updateIntegralCache;
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

      make(`Linear, truncatedShape, None, None);
    };

    // TODO: This should work with stepwise plots.
    let integral = (t) => {
      if (t |> getShape |> XYShape.T.isEmpty) {
        make(`Linear, {xs: [|neg_infinity|], ys: [|0.0|]}, None, None);
      } else {
        switch (t.integralCache) {
        | Some(cache) => cache
        | None =>
          t
          |> getShape
          |> XYShape.Range.integrateWithTriangles
          |> E.O.toExt("This should not have happened")
          |> make(`Linear, _, None, None)
        };
      };
      };

    let downsample = (length, t): t =>
      t
      |> shapeMap(
           XYShape.XsConversion.proportionByProbabilityMass(
             length,
             integral(t).xyShape,
           ),
         );
    let integralEndY = (t: t) =>
      t.integralSumCache |> E.O.default(t |> integral |> lastY);
    let integralXtoY = (f, t: t) =>
      t |> integral |> shapeFn(XYShape.XtoY.linear(f));
    let integralYtoX = (f, t: t) =>
      t |> integral |> shapeFn(XYShape.YtoX.linear(f));
    let toContinuous = t => Some(t);
    let toDiscrete = _ => None;

    let normalize = (t: t): t => {
      t
      |> updateIntegralCache(Some(integral(t)))
      |> scaleBy(~scale=1. /. integralEndY(t))
      |> updateIntegralSumCache(Some(1.0));
    };

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
      op: ExpressionTypes.algebraicOperation,
      t1: t,
      t2: DistTypes.discreteShape,
    ) => {
  let t1s = t1 |> getShape;
  let t2s = t2.xyShape; // would like to use Discrete.getShape here, but current file structure doesn't allow for that

  if (XYShape.T.isEmpty(t1s) || XYShape.T.isEmpty(t2s)) {
    empty;
  } else {
    let shapeArray = AlgebraicShapeCombination.combineShapesContinuousDiscrete(op, t1s, t2s);

    let t1Interpolator = XYShape.XtoY.continuousInterpolator(t1.interpolation, `UseZero);
    let t2Interpolator = XYShape.XtoY.discreteInterpolator;

    let combinedShape =
      shapeArray
      |> E.A.fold_left(
          XYShape.PointwiseCombination.combine((+.),
                                              t1Interpolator,
                                              t2Interpolator),
          XYShape.T.empty);

    let combinedIntegralSum =
      Common.combineIntegralSums(
        (a, b) => Some(a *. b),
        t1.integralSumCache,
        t2.integralSumCache,
      );

    // TODO: It could make sense to automatically transform the integrals here (shift or scale)
    make(t1.interpolation, combinedShape, combinedIntegralSum, None)
  };
};

let combineAlgebraically =
    (op: ExpressionTypes.algebraicOperation, t1: t, t2: t) => {
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
        t1.integralSumCache,
        t2.integralSumCache,
      );
    // return a new Continuous distribution
    make(`Linear, combinedShape, combinedIntegralSum, None);
  };
};
