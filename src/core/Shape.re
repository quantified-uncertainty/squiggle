open DistributionTypes;

let _lastElement = (a: array('a)) =>
  switch (Belt.Array.size(a)) {
  | 0 => None
  | n => Belt.Array.get(a, n - 1)
  };

type pointInRange =
  | Unbounded
  | X(float);

module XYShape = {
  type t = xyShape;

  let toJs = (t: t) => {
    {"xs": t.xs, "ys": t.ys};
  };

  let minX = (t: t) => t.xs |> E.A.get(_, 0);
  // TODO: Check if this actually gets the last element, I'm not sure it does.
  let maxX = (t: t) => t.xs |> (r => E.A.get(r, E.A.length(r) - 1));

  let zip = t => Belt.Array.zip(t.xs, t.ys);

  let fmap = (t: t, y): t => {xs: t.xs, ys: t.ys |> E.A.fmap(y)};

  let pointwiseMap = (fn, t: t): t => {xs: t.xs, ys: t.ys |> E.A.fmap(fn)};

  let scaleCdfTo = (~scaleTo=1., t: t) =>
    switch (_lastElement(t.ys)) {
    | Some(n) =>
      let scaleBy = scaleTo /. n;
      fmap(t, r => r *. scaleBy);
    | None => t
    };

  let yFold = (fn, t: t) => {
    E.A.fold_left(fn, 0., t.ys);
  };

  let ySum = yFold((a, b) => a +. b);

  let fromArray = ((xs, ys)): t => {xs, ys};
  let fromArrays = (xs, ys): t => {xs, ys};

  let _transverse = fn =>
    Belt.Array.reduce(_, [||], (items, (x, y)) =>
      switch (_lastElement(items)) {
      | Some((xLast, yLast)) =>
        Belt.Array.concat(items, [|(x, fn(y, yLast))|])
      | None => [|(x, y)|]
      }
    );

  let _transverseShape = (fn, p: t) => {
    Belt.Array.zip(p.xs, p.ys)
    |> _transverse(fn)
    |> Belt.Array.unzip
    |> fromArray;
  };

  let accumulateYs = _transverseShape((aCurrent, aLast) => aCurrent +. aLast);
  let subtractYs = _transverseShape((aCurrent, aLast) => aCurrent -. aLast);

  module Range = {
    // ((lastX, lastY), (nextX, nextY))
    type zippedRange = ((float, float), (float, float));

    let floatSum = Belt.Array.reduce(_, 0., (a, b) => a +. b);
    let toT = r => r |> Belt.Array.unzip |> fromArray;
    let nextX = ((_, (nextX, _)): zippedRange) => nextX;

    let rangeAreaAssumingSteps =
        (((lastX, lastY), (nextX, _)): zippedRange) =>
      (nextX -. lastX) *. lastY;

    let rangeAreaAssumingTriangles =
        (((lastX, lastY), (nextX, nextY)): zippedRange) =>
      (nextX -. lastX) *. (lastY +. nextY) /. 2.;

    let delta_y_over_delta_x =
        (((lastX, lastY), (nextX, nextY)): zippedRange) =>
      (nextY -. lastY) /. (nextX -. lastX);

    let inRanges = (mapper, reducer, t: t) => {
      Belt.Array.zip(t.xs, t.ys)
      |> E.A.toRanges
      |> E.R.toOption
      |> E.O.fmap(r => r |> Belt.Array.map(_, mapper) |> reducer);
    };

    let mapYsBasedOnRanges = fn => inRanges(r => (nextX(r), fn(r)), toT);

    let integrateWithSteps = z =>
      mapYsBasedOnRanges(rangeAreaAssumingSteps, z) |> E.O.fmap(accumulateYs);

    let integrateWithTriangles = z =>
      mapYsBasedOnRanges(rangeAreaAssumingTriangles, z)
      |> E.O.fmap(accumulateYs);

    let derivative = mapYsBasedOnRanges(delta_y_over_delta_x);
  };

  let findY = CdfLibrary.Distribution.findY;
  let findX = CdfLibrary.Distribution.findX;
};

module Continuous = {
  type t = continuousShape;
  let shape = (t: t) => t.shape;
  let getShape = (t: t) => t.shape;
  let interpolation = (t: t) => t.interpolation;
  let make = (shape, interpolation) => {shape, interpolation};
  let fromShape = shape => make(shape, `Linear);
  let shapeMap = (fn, {shape, interpolation}: t) => {
    shape: fn(shape),
    interpolation,
  };
  let oShapeMap = (fn, {shape, interpolation}: t) =>
    fn(shape) |> E.O.fmap(shape => {shape, interpolation});
  let shapeFn = (fn, t: t) => t |> shape |> fn;
  let minX = shapeFn(XYShape.minX);
  let maxX = shapeFn(XYShape.maxX);
  let findX = y => shapeFn(CdfLibrary.Distribution.findX(y));
  let findY = x => shapeFn(CdfLibrary.Distribution.findY(x));
  let toJs = shapeFn(XYShape.toJs);
  let fromArrays = (a, b) => make(XYShape.fromArrays(a, b), `Linear);
  let toPdf = (t: t) => t |> oShapeMap(XYShape.Range.derivative);
  let toCdf = (t: t) => t |> oShapeMap(XYShape.Range.integrateWithTriangles);
  let findIntegralY = (f, t) => {
    t
    |> toCdf
    |> E.O.fmap(shape)
    |> E.O.fmap(CdfLibrary.Distribution.findY(f));
  };
  let normalizeCdf = (continuousShape: continuousShape) =>
    continuousShape |> shape |> XYShape.scaleCdfTo(~scaleTo=1.0) |> fromShape;
  let scalePdf = (~scaleTo=1.0, continuousShape: continuousShape) => {
    switch (toCdf(continuousShape)) {
    | Some({shape}) =>
      XYShape.scaleCdfTo(~scaleTo, shape)
      |> XYShape.Range.derivative
      |> E.O.fmap(fromShape)
    | _ => None
    };
  };
};

module Discrete = {
  let minX = XYShape.minX;
  let maxX = XYShape.maxX;
  type t = discreteShape;
  let fromArrays = XYShape.fromArrays;
  let toJs = XYShape.toJs;
  let ySum = XYShape.ySum;
  let zip = t => Belt.Array.zip(t.xs, t.ys);
  let pointwiseMap = (t: discreteShape, fn): discreteShape => {
    xs: t.xs,
    ys: t.ys |> E.A.fmap(fn),
  };

  let scaleYToTotal = (totalDesired, t: t): t => {
    let difference = totalDesired /. ySum(t);
    XYShape.fmap(t, y => y *. difference);
  };

  let render = (t: t) =>
    Belt.Array.zip(t.xs, t.ys)
    |> E.A.fmap(((x, y)) =>
         <div>
           {E.Float.toFixed(x)
            ++ "---"
            ++ E.Float.with3DigitsPrecision(y *. 100.)
            |> ReasonReact.string}
         </div>
       )
    |> ReasonReact.array;

  let integrate = t => t |> XYShape.accumulateYs |> Continuous.fromShape;
  let derivative = XYShape.subtractYs;

  // TODO: This has a clear bug where it returns the Y value of the first item,
  // even if X is less than the X of the first item.
  // It has a second bug that it assumes things are triangular, instead of interpolating via steps.
  let findIntegralY = (f, t: t) => {
    t |> XYShape.accumulateYs |> CdfLibrary.Distribution.findY(f);
  };

  let findY = (f, t: t) => {
    Belt.Array.zip(t.xs, t.ys)
    |> E.A.getBy(_, ((x, _)) => x == f)
    |> E.O.fmap(((_, y)) => y)
    |> E.O.default(0.);
  };
};

let min = (f1: option(float), f2: option(float)) =>
  switch (f1, f2) {
  | (Some(f1), Some(f2)) => Some(f1 < f2 ? f1 : f2)
  | (Some(f1), None) => Some(f1)
  | (None, Some(f2)) => Some(f2)
  | (None, None) => None
  };

let max = (f1: option(float), f2: option(float)) =>
  switch (f1, f2) {
  | (Some(f1), Some(f2)) => Some(f1 > f2 ? f1 : f2)
  | (Some(f1), None) => Some(f1)
  | (None, Some(f2)) => Some(f2)
  | (None, None) => None
  };

module Mixed = {
  let make = (~continuous, ~discrete, ~discreteProbabilityMassFraction) => {
    continuous,
    discrete,
    discreteProbabilityMassFraction,
  };

  let minX = (t: DistributionTypes.mixedShape) =>
    min(t.continuous |> Continuous.minX, t.discrete |> Discrete.minX);

  let maxX = (t: DistributionTypes.mixedShape) => {
    max(t.continuous |> Continuous.maxX, t.discrete |> Discrete.maxX);
  };

  let mixedMultiply =
      (
        t: DistributionTypes.mixedShape,
        continuousComponent,
        discreteComponent,
      ) => {
    let diffFn = t.discreteProbabilityMassFraction;
    continuousComponent *. (1.0 -. diffFn) +. discreteComponent *. diffFn;
  };

  type yPdfPoint = {
    continuous: option(float),
    discrete: option(float),
  };

  let findY = (t: DistributionTypes.mixedShape, x: float): yPdfPoint => {
    continuous:
      Continuous.findY(x, t.continuous)
      |> (e => e *. (1. -. t.discreteProbabilityMassFraction))
      |> E.O.some,
    discrete:
      Discrete.findY(x, t.discrete)
      |> (e => e *. t.discreteProbabilityMassFraction)
      |> E.O.some,
  };

  let findYIntegral =
      (x: float, t: DistributionTypes.mixedShape): option(float) => {
    let c = t.continuous |> Continuous.findIntegralY(x);
    let d = Discrete.findIntegralY(x, t.discrete);
    switch (c, d) {
    | (Some(c), d) => Some(mixedMultiply(t, c, d))
    | _ => None
    };
  };

  let clean = (t: DistributionTypes.mixedShape) =>
    switch (t) {
    | {
        continuous: {shape: {xs: [||], ys: [||]}},
        discrete: {xs: [||], ys: [||]},
      } =>
      None
    | {discrete: {xs: [|_|], ys: [|_|]}} => None
    | {continuous, discrete: {xs: [||], ys: [||]}} =>
      Some(Continuous(continuous))
    | {continuous: {shape: {xs: [||], ys: [||]}}, discrete} =>
      Some(Discrete(discrete))
    | shape => Some(Mixed(shape))
    };
};

module T = {
  type t = DistributionTypes.shape;

  let mapToAll = (t: t, (fn1, fn2, fn3)) =>
    switch (t) {
    | Mixed(m) => fn1(m)
    | Discrete(m) => fn2(m)
    | Continuous(m) => fn3(m)
    };

  let fmap = (t: t, (fn1, fn2, fn3)) =>
    switch (t) {
    | Mixed(m) => Mixed(fn1(m))
    | Discrete(m) => Discrete(fn2(m))
    | Continuous(m) => Continuous(fn3(m))
    };

  let y = (t: t, x: float) =>
    switch (t) {
    | Mixed(m) => `mixed(Mixed.findY(m, x))
    | Discrete(discreteShape) => `discrete(Discrete.findY(x, discreteShape))
    | Continuous(continuousShape) =>
      `continuous(Continuous.findY(x, continuousShape))
    };

  let yIntegral = (t: t, x: float) =>
    switch (t) {
    | Mixed(m) => Mixed.findYIntegral(x, m)
    | Discrete(discreteShape) =>
      Discrete.findIntegralY(x, discreteShape) |> E.O.some
    | Continuous(continuousShape) =>
      Continuous.findIntegralY(x, continuousShape)
    };

  let minX = (t: t) =>
    switch (t) {
    | Mixed(m) => Mixed.minX(m)
    | Discrete(discreteShape) => Discrete.minX(discreteShape)
    | Continuous(continuousShape) => Continuous.minX(continuousShape)
    };

  let maxX = (t: t) =>
    switch (t) {
    | Mixed(m) => Mixed.maxX(m)
    | Discrete(discreteShape) => Discrete.maxX(discreteShape)
    | Continuous(continuousShape) => Continuous.maxX(continuousShape)
    };

  let discreteComponent = (t: t) =>
    switch (t) {
    | Mixed({discrete}) => Some(discrete)
    | Discrete(d) => Some(d)
    | Continuous(_) => None
    };

  let continuousComponent = (t: t) =>
    switch (t) {
    | Mixed({continuous}) => Some(continuous)
    | Continuous(c) => Some(c)
    | Discrete(_) => None
    };

  // let scaledContinuousComponent = (t: t): option(continuousShape) => {
  //   switch (t) {
  //   | Mixed({continuous, discreteProbabilityMassFraction}) =>
  //     Continuous.scalePdf(
  //       ~scaleTo=1.0 -. discreteProbabilityMassFraction,
  //       continuous,
  //     )
  //   | Discrete(_) => None
  //   | Continuous(c) => Some(c)
  //   };
  // };

  // let scaledDiscreteComponent = (t: t): option(discreteShape) => {
  //   switch (t) {
  //   | Mixed({discrete, discreteProbabilityMassFraction}) =>
  //     Some(Discrete.scaleYToTotal(discreteProbabilityMassFraction, discrete))
  //   | Discrete(d) => Some(d)
  //   | Continuous(_) => None
  //   };
  // };

  // let pointwiseFmap = (fn, t: t): shape =>
  //   switch (t) {
  //   | Mixed({discrete, continuous, discreteProbabilityMassFraction}) =>
  //     Mixed({
  //       continuous: XYShape.pointwiseMap(fn, continuous),
  //       discrete: XYShape.pointwiseMap(fn, discrete),
  //       discreteProbabilityMassFraction,
  //     })
  //   | Discrete(x) => Discrete(XYShape.pointwiseMap(fn, x))
  //   | Continuous(x) => Continuous(XYShape.pointwiseMap(fn, x))
  //   };

  // module Cdf = {
  //   let normalizeCdf = (t: DistributionTypes.shape) => {
  //     switch (t) {
  //     | Mixed({continuous, discrete, discreteProbabilityMassFraction}) =>
  //       Mixed({
  //         continuous: continuous |> Continuous.normalizeCdf,
  //         discrete: discrete |> Discrete.scaleYToTotal(1.0),
  //         discreteProbabilityMassFraction,
  //       })
  //     | Discrete(d) => Discrete(d |> Discrete.scaleYToTotal(1.0))
  //     | Continuous(continuousShape) =>
  //       Continuous(Continuous.normalizeCdf(continuousShape))
  //     };
  //   };
  // };

  module Pdf = {
    // TODO: This is wrong. The discrete component should be made continuous when integrating.
    // let toCdf = (t: t) =>
    //   switch (t) {
    //   | Mixed({continuous, discrete, discreteProbabilityMassFraction}) =>
    //     Some(
    //       Mixed({
    //         continuous: Continuous.toCdf(continuous) |> E.O.toExt(""),
    //         discrete: discrete |> Discrete.integrate,
    //         discreteProbabilityMassFraction,
    //       }),
    //     )
    //   | Discrete(discrete) =>
    //     Some(Continuous(discrete |> Discrete.integrate))
    //   | Continuous(continuous) =>
    //     Continuous.toCdf(continuous) |> E.O.fmap(e => Continuous(e))
    //   };
    // let normalize = (t: DistributionTypes.shape): option(shape) => {
    //   switch (t) {
    //   | Mixed({continuous, discrete, discreteProbabilityMassFraction}) =>
    //     continuous
    //     |> Continuous.scalePdf(~scaleTo=1.0)
    //     |> E.O.fmap(r =>
    //          Mixed({
    //            continuous: r,
    //            discrete: discrete |> Discrete.scaleYToTotal(1.0),
    //            discreteProbabilityMassFraction,
    //          })
    //        )
    //   | Discrete(d) => Some(Discrete(d |> Discrete.scaleYToTotal(1.0)))
    //   | Continuous(continuousShape) =>
    //     continuousShape
    //     |> Continuous.scalePdf(~scaleTo=1.0)
    //     |> E.O.fmap(r => Continuous(r))
    //   };
    // };
  };
};

module PdfCdfShape = {
  type t = pdfCdfCombo;
  let pdf = (t: t) =>
    switch (t.pdf) {
    | Mixed(pdf) => Mixed(pdf)
    | Discrete(pdf) => Discrete(pdf)
    | Continuous(pdf) => Continuous(pdf)
    };
  let cdf = (t: t) => t.cdf;
};

type distributionUnit =
  | UnspecifiedDistribution
  | TimeDistribution(TimeTypes.timeVector);

type withLimitedDomain = {
  domain,
  dist: pdfCdfCombo,
};

module WithLimitedDomain = {
  type t = withLimitedDomain;
  let dist = (t: t) => t.dist;
  let pdf = (t: t) => PdfCdfShape.pdf(t.dist);
  let cdf = (t: t) => PdfCdfShape.cdf(t.dist);
  // TODO: This is bad, obviously needs to be fixed.
  let distScaleFactor = (t: t) => 3.0;
  // let scaledPdfShape = (scaleFactor, t: t) =>
  //   t |> pdf |> T.pointwiseFmap(r => r *. scaleFactor);
  // let scaledCdfShape = (scaleFactor, t: t) =>
  //   t |> cdf |> XYShape.pointwiseMap(r => r *. scaleFactor);
};

type withTimeVector = {
  timeVector: TimeTypes.timeVector,
  dist: withLimitedDomain,
};