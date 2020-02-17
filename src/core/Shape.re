open DistributionTypes;

let _lastElement = (a: array('a)) =>
  switch (Belt.Array.size(a)) {
  | 0 => None
  | n => Belt.Array.get(a, n - 1)
  };

module XYShape = {
  type t = xyShape;

  let toJs = (t: t) => {
    {"xs": t.xs, "ys": t.ys};
  };

  let fmap = (t: t, y): t => {xs: t.xs, ys: t.ys |> E.A.fmap(y)};

  let yFold = (fn, t: t) => {
    E.A.fold_left(fn, 0., t.ys);
  };

  let ySum = yFold((a, b) => a +. b);

  let fromArrays = (xs, ys): t => {xs, ys};

  let transverse = (fn, p: t) => {
    let (xs, ys) =
      Belt.Array.zip(p.xs, p.ys)
      ->Belt.Array.reduce([||], (items, (x, y)) =>
          switch (_lastElement(items)) {
          | Some((_, yLast)) =>
            Belt.Array.concat(items, [|(x, fn(y, yLast))|])
          | None => [|(x, y)|]
          }
        )
      |> Belt.Array.unzip;
    fromArrays(xs, ys);
  };

  let integral = transverse((aCurrent, aLast) => aCurrent +. aLast);
  let derivative = transverse((aCurrent, aLast) => aCurrent -. aLast);
};

module Continuous = {
  let fromArrays = XYShape.fromArrays;
  let toJs = XYShape.toJs;
  let toPdf = CdfLibrary.Distribution.toPdf;
  let toCdf = CdfLibrary.Distribution.toCdf;
  let findX = CdfLibrary.Distribution.findX;
  let findY = CdfLibrary.Distribution.findY;
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

  let findY = (x: float, t: t) =>
    switch (E.A.getBy(zip(t), ((ix, _)) => ix == x)) {
    | Some((_, y)) => y
    | None => 0.
    };
};

module Mixed = {
  let make = (~continuous, ~discrete, ~discreteProbabilityMassFraction) => {
    continuous,
    discrete,
    discreteProbabilityMassFraction,
  };

  type yPdfPoint = {
    continuous: float,
    discrete: float,
  };

  let getY = (t: DistributionTypes.mixedShape, x: float): yPdfPoint => {
    continuous: Continuous.findY(x, t.continuous),
    discrete: Discrete.findY(x, t.discrete),
  };
};

module DomainMixed = {
  type t = {
    mixedShape,
    domain,
  };
};