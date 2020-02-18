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

  let fmap = (t: t, y): t => {xs: t.xs, ys: t.ys |> E.A.fmap(y)};

  let yFold = (fn, t: t) => {
    E.A.fold_left(fn, 0., t.ys);
  };

  let ySum = yFold((a, b) => a +. b);

  let fromArray = ((xs, ys)): t => {xs, ys};
  let fromArrays = (xs, ys): t => {xs, ys};

  let transverse = (fn, p: t) => {
    let (xs, ys) =
      Belt.Array.zip(p.xs, p.ys)
      ->Belt.Array.reduce([||], (items, (x, y)) =>
          switch (_lastElement(items)) {
          | Some((_, yLast)) =>
            Js.log3(y, yLast, fn(y, yLast));
            Belt.Array.concat(items, [|(x, fn(y, yLast))|]);
          | None => [|(x, y)|]
          }
        )
      |> Belt.Array.unzip;
    fromArrays(xs, ys);
  };

  type zippedRange = ((float, float), (float, float));

  let inRanges = (fn, t: t) => {
    let ranges: Belt.Result.t(array(zippedRange), string) =
      Belt.Array.zip(t.xs, t.ys) |> E.A.toRanges;
    ranges |> E.R.toOption |> E.O.fmap(fn);
  };

  let sum = Belt.Array.reduce(_, 0., (a, b) => a +. b);

  let volume = {
    let assumeLastY = (((lastX, lastY), (nextX, _)): zippedRange) =>
      (nextX -. lastX) *. lastY;

    inRanges((inRanges: array(zippedRange)) =>
      Belt.Array.map(inRanges, assumeLastY) |> sum
    );
  };

  let volumeTriangle = {
    let assumeLastY = (((lastX, lastY), (nextX, nextY)): zippedRange) =>
      (nextX -. lastX) *. (lastY -. nextY) /. 2.;

    inRanges((inRanges: array(zippedRange)) =>
      Belt.Array.map(inRanges, assumeLastY) |> sum
    );
  };

  let volum2 = {
    let assumeLastY = (((lastX, lastY), (nextX, _)): zippedRange) => (
      nextX,
      (nextX -. lastX) *. lastY,
    );

    inRanges((inRanges: array(zippedRange)) =>
      Belt.Array.map(inRanges, assumeLastY) |> Belt.Array.unzip |> fromArray
    );
  };

  let diff = {
    let assumeLastY = (((lastX, lastY), (nextX, _)): zippedRange) => (
      nextX,
      (lastY -. lastY) /. (nextX -. lastX),
    );

    inRanges((inRanges: array(zippedRange)) =>
      Belt.Array.map(inRanges, assumeLastY) |> Belt.Array.unzip |> fromArray
    );
  };
  let getY = (t: t, x: float) => x;
  let findY = (t: t, x: float) => x;

  let integral = transverse((aCurrent, aLast) => aCurrent +. aLast);
  let derivative = transverse((aCurrent, aLast) => aCurrent -. aLast);
  // let massWithin = (t: t, left: pointInRange, right: pointInRange) => {
  //   switch (left, right) {
  //   | (Unbounded, Unbounded) => t |> ySum
  //   | (Unbounded, X(f)) => t |> integral |> getY(t, 3.0)
  //   | (X(f), Unbounded) => ySum(t) -. getY(integral(t), f)
  //   | (X(l), X(r)) => getY(integral(t), r) -. getY(integral(t), l)
  //   };
  // };
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

module Any = {
  type t = DistributionTypes.pointsType;

  let x = (t: t, x: float) =>
    switch (t) {
    | Mixed(m) => `mixed(Mixed.getY(m, x))
    | Discrete(discreteShape) => `discrete(Discrete.findY(x, discreteShape))
    | Continuous(continuousShape) =>
      `continuous(Continuous.findY(x, continuousShape))
    };

  let massInRange = (t: t, left: pointInRange, right: pointInRange) =>
    switch (t) {
    | Mixed(m) => 3.0
    | Discrete(discreteShape) => 2.0
    | Continuous(continuousShape) => 3.0
    };
};

module DomainMixed = {
  type t = {
    mixedShape,
    domain,
  };
};