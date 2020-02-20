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

  let zip = t => Belt.Array.zip(t.xs, t.ys);

  let fmap = (t: t, y): t => {xs: t.xs, ys: t.ys |> E.A.fmap(y)};

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
  let fromArrays = XYShape.fromArrays;
  let toJs = XYShape.toJs;
  let toPdf = XYShape.Range.derivative;
  let toCdf = XYShape.Range.integrateWithTriangles;
  let findX = CdfLibrary.Distribution.findX;
  let findY = CdfLibrary.Distribution.findY;
  let findIntegralY = (f, r) => {
    r |> toCdf |> E.O.fmap(findY(f));
  };

  let normalizeCdf = (continuousShape: continuousShape) =>
    continuousShape |> XYShape.scaleCdfTo(~scaleTo=1.0);

  let normalizePdf = (continuousShape: continuousShape) =>
    continuousShape |> toCdf |> E.O.fmap(normalizeCdf) |> E.O.bind(_, toPdf);
};

module Discrete = {
  type t = discreteShape;
  let fromArrays = XYShape.fromArrays;
  let toJs = XYShape.toJs;
  let ySum = XYShape.ySum;
  let zip = t => Belt.Array.zip(t.xs, t.ys);

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

  let integrate = XYShape.accumulateYs;
  let derivative = XYShape.subtractYs;

  // TODO: This has a clear bug where it returns the Y value of the first item,
  // even if X is less than the X of the first item.
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

module Mixed = {
  let make = (~continuous, ~discrete, ~discreteProbabilityMassFraction) => {
    continuous,
    discrete,
    discreteProbabilityMassFraction,
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
    discreteProbabilityMassFraction: float,
  };

  let findY = (t: DistributionTypes.mixedShape, x: float): yPdfPoint => {
    continuous: Continuous.findY(x, t.continuous) |> E.O.some,
    discrete: Discrete.findY(x, t.discrete) |> E.O.some,
    discreteProbabilityMassFraction: t.discreteProbabilityMassFraction,
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
  //Do the math to add these distributions together
  // let integral =
  //     (x: float, t: DistributionTypes.mixedShape): option(XYShape.t) => {
  // };
};

module Any = {
  type t = DistributionTypes.pointsType;

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

  // TODO: This is wrong. The discrete component should be made continuous when integrating.
  let pdfToCdf = (t: t) =>
    switch (t) {
    | Mixed({continuous, discrete, discreteProbabilityMassFraction}) =>
      Some(
        Mixed({
          continuous: Continuous.toCdf(continuous) |> E.O.toExt(""),
          discrete: discrete |> Discrete.integrate,
          discreteProbabilityMassFraction,
        }),
      )
    | Discrete(discrete) => Some(Continuous(discrete |> Discrete.integrate))
    | Continuous(continuous) =>
      Continuous.toCdf(continuous) |> E.O.fmap(e => Continuous(e))
    };
};

module DomainMixed = {
  type t = {
    mixedShape,
    domain,
  };
};