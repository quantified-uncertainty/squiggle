open Distributions;

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

let combinePointwise =
    (
      ~knownIntegralSumsFn,
      fn,
      t1: DistTypes.discreteShape,
      t2: DistTypes.discreteShape,
    )
    : DistTypes.discreteShape => {
  let combinedIntegralSum =
    Common.combineIntegralSums(
      knownIntegralSumsFn,
      t1.knownIntegralSum,
      t2.knownIntegralSum,
    );

  make(
    XYShape.PointwiseCombination.combine(
      ~xsSelection=ALL_XS,
      ~xToYSelection=XYShape.XtoY.stepwiseIfAtX,
      ~fn=(a, b) => fn(E.O.default(0.0, a), E.O.default(0.0, b)), // stepwiseIfAtX returns option(float), so this fn needs to handle None
      t1.xyShape,
      t2.xyShape,
    ),
    combinedIntegralSum,
  );
};

let reduce =
    (~knownIntegralSumsFn=(_, _) => None, fn, discreteShapes)
    : DistTypes.discreteShape =>
  discreteShapes
  |> E.A.fold_left(combinePointwise(~knownIntegralSumsFn, fn), empty);

let updateKnownIntegralSum = (knownIntegralSum, t: t): t => {
  ...t,
  knownIntegralSum,
};

/* This multiples all of the data points together and creates a new discrete distribution from the results.
   Data points at the same xs get added together. It may be a good idea to downsample t1 and t2 before and/or the result after. */
let combineAlgebraically =
    (op: ExpressionTypes.algebraicOperation, t1: t, t2: t) => {
  let t1s = t1 |> getShape;
  let t2s = t2 |> getShape;
  let t1n = t1s |> XYShape.T.length;
  let t2n = t2s |> XYShape.T.length;

  let combinedIntegralSum =
    Common.combineIntegralSums(
      (s1, s2) => Some(s1 *. s2),
      t1.knownIntegralSum,
      t2.knownIntegralSum,
    );

  let fn = Operation.Algebraic.toFn(op);
  let xToYMap = E.FloatFloatMap.empty();

  for (i in 0 to t1n - 1) {
    for (j in 0 to t2n - 1) {
      let x = fn(t1s.xs[i], t2s.xs[j]);
      let cv = xToYMap |> E.FloatFloatMap.get(x) |> E.O.default(0.);
      let my = t1s.ys[i] *. t2s.ys[j];
      let _ = Belt.MutableMap.set(xToYMap, x, cv +. my);
      ();
    };
  };

  let rxys = xToYMap |> E.FloatFloatMap.toArray |> XYShape.Zipped.sortByX;

  let combinedShape = XYShape.T.fromZippedArray(rxys);

  make(combinedShape, combinedIntegralSum);
};

let mapY = (~knownIntegralSumFn=previousKnownIntegralSum => None, fn, t: t) => {
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
    type t = DistTypes.discreteShape;
    type integral = DistTypes.continuousShape;
    let integral = (~cache, t) =>
      if (t |> getShape |> XYShape.T.length > 0) {
        switch (cache) {
        | Some(c) => c
        | None =>
          Continuous.make(
            `Stepwise,
            XYShape.T.accumulateYs((+.), getShape(t)),
            None,
          )
        };
      } else {
        Continuous.make(
          `Stepwise,
          {xs: [|neg_infinity|], ys: [|0.0|]},
          None,
        );
      };

    let integralEndY = (~cache, t: t) =>
      t.knownIntegralSum
      |> E.O.default(t |> integral(~cache) |> Continuous.lastY);
    let minX = shapeFn(XYShape.T.minX);
    let maxX = shapeFn(XYShape.T.maxX);
    let toDiscreteProbabilityMassFraction = _ => 1.0;
    let mapY = mapY;
    let toShape = (t: t): DistTypes.shape => Discrete(t);
    let toContinuous = _ => None;
    let toDiscrete = t => Some(t);

    let normalize = (t: t): t => {
      t
      |> scaleBy(~scale=1. /. integralEndY(~cache=None, t))
      |> updateKnownIntegralSum(Some(1.0));
    };

    let normalizedToContinuous = _ => None;
    let normalizedToDiscrete = t => Some(t); // TODO: this should be normalized!

    let downsample = (~cache=None, i, t: t): t => {
      // It's not clear how to downsample a set of discrete points in a meaningful way.
      // The best we can do is to clip off the smallest values.
      let currentLength = t |> getShape |> XYShape.T.length;

      if (i < currentLength && i >= 1 && currentLength > 1) {
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
      } else {
        t;
      };
    };

    let truncate =
        (leftCutoff: option(float), rightCutoff: option(float), t: t): t => {
      let truncatedShape =
        t
        |> getShape
        |> XYShape.T.zip
        |> XYShape.Zipped.filterByX(x =>
             x >= E.O.default(neg_infinity, leftCutoff)
             || x <= E.O.default(infinity, rightCutoff)
           )
        |> XYShape.T.fromZippedArray;

      make(truncatedShape, None);
    };

    let xToY = (f, t) =>
      t
      |> getShape
      |> XYShape.XtoY.stepwiseIfAtX(f)
      |> E.O.default(0.0)
      |> DistTypes.MixedPoint.makeDiscrete;

    let integralXtoY = (~cache, f, t) =>
      t |> integral(~cache) |> Continuous.getShape |> XYShape.XtoY.linear(f);

    let integralYtoX = (~cache, f, t) =>
      t |> integral(~cache) |> Continuous.getShape |> XYShape.YtoX.linear(f);

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
