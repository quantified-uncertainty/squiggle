module ContinuousDistribution = {
  type t = {
    xs: array(float),
    ys: array(float),
  };

  let toJs = (t: t) => {
    {"xs": t.xs, "ys": t.ys};
  };

  let toComponentsDist = (d: t): ForetoldComponents.Types.Dist.t => {
    xs: d.xs,
    ys: d.ys,
  };

  type pdf = t;
  type cdf = t;
};

module DiscreteDistribution = {
  type t = {
    xs: array(float),
    ys: array(float),
  };

  let fromArray = (xs, ys) => {xs, ys};

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
    fromArray(xs, ys);
  };

  let integral = (p: t) => {
    let (xs, ys) =
      Belt.Array.zip(p.xs, p.ys)
      ->Belt.Array.reduce([||], (items, (x, y)) =>
          switch (_lastElement(items)) {
          | Some((_, yLast)) => [|(x, y +. yLast)|]
          | None => [|(x, y)|]
          }
        )
      |> Belt.Array.unzip;
    fromArray(xs, ys);
  };
};

module MixedDistribution = {
  type distribution = {
    discrete: DiscreteDistribution.t,
    continuous: ContinuousDistribution.t,
  };
};