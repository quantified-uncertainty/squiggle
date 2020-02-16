open DistributionTypes;

module Continuous = {
  let fromArrays = (xs, ys): continuousShape => {xs, ys};
  let toJs = (t: continuousShape) => {
    {"xs": t.xs, "ys": t.ys};
  };
  let toPdf = CdfLibrary.Distribution.toPdf;
  let toCdf = CdfLibrary.Distribution.toCdf;
  let findX = CdfLibrary.Distribution.findX;
  let findY = CdfLibrary.Distribution.findY;
};

module Discrete = {
  type t = discreteShape;
  let fromArrays = (xs, ys): discreteShape => {xs, ys};
  let _lastElement = (a: array('a)) =>
    switch (Belt.Array.size(a)) {
    | 0 => None
    | n => Belt.Array.get(a, n)
    };

  let derivative = (p: t) => {
    let (xs, ys) =
      Belt.Array.zip(p.xs, p.ys)
      ->Belt.Array.reduce([||], (items, (x, y)) =>
          switch (_lastElement(items)) {
          | Some((_, yLast)) => [|(x, y -. yLast)|]
          | None => [|(x, y)|]
          }
        )
      |> Belt.Array.unzip;
    fromArrays(xs, ys);
  };

  let integral = (p: t) => {
    let (xs, ys) =
      Belt.Array.zip(p.xs, p.ys)
      ->Belt.Array.reduce([||], (items, (x, y)) =>
          switch (_lastElement(items)) {
          | Some((_, yLast)) => E.A.append(items, [|(x, y +. yLast)|])
          | None => [|(x, y)|]
          }
        )
      |> Belt.Array.unzip;
    fromArrays(xs, ys);
  };

  let ySum = (t: t) => {
    E.A.fold_left((a, b) => a +. b, 0., t.ys);
  };

  let scaleYToTotal = (totalDesired, t: t): t => {
    let currentSum = ySum(t);
    let difference = totalDesired /. currentSum;
    {xs: t.xs, ys: t.ys |> E.A.fmap(y => y *. difference)};
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
};

module Mixed = {
  let make = (~continuous, ~discrete, ~discreteProbabilityMassFraction) => {
    continuous,
    discrete,
    discreteProbabilityMassFraction,
  };

  module Builder = {
    type assumption =
      | ADDS_TO_1
      | ADDS_TO_CORRECT_PROBABILITY;
    type assumptions = {
      continuous: assumption,
      discrete: assumption,
      discreteProbabilityMass: option(float),
    };
    let build = (~continuous, ~discrete, ~assumptions) =>
      switch (assumptions) {
      | {
          continuous: ADDS_TO_CORRECT_PROBABILITY,
          discrete: ADDS_TO_CORRECT_PROBABILITY,
          discreteProbabilityMass: Some(r),
        } =>
        // TODO: Fix this, it's wrong :(
        Some(
          make(~continuous, ~discrete, ~discreteProbabilityMassFraction=r),
        )
      | {
          continuous: ADDS_TO_1,
          discrete: ADDS_TO_1,
          discreteProbabilityMass: Some(r),
        } =>
        Some(
          make(~continuous, ~discrete, ~discreteProbabilityMassFraction=r),
        )
      | {
          continuous: ADDS_TO_1,
          discrete: ADDS_TO_1,
          discreteProbabilityMass: None,
        } =>
        None
      | {
          continuous: ADDS_TO_CORRECT_PROBABILITY,
          discrete: ADDS_TO_1,
          discreteProbabilityMass: None,
        } =>
        None
      | {
          continuous: ADDS_TO_1,
          discrete: ADDS_TO_CORRECT_PROBABILITY,
          discreteProbabilityMass: None,
        } =>
        let discreteProbabilityMassFraction = Discrete.ySum(discrete);
        let discrete = Discrete.scaleYToTotal(1.0, discrete);
        Some(make(~continuous, ~discrete, ~discreteProbabilityMassFraction));
      | _ => None
      };
  };
};