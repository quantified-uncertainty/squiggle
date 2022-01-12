module Dist = {
  type t = {
    xs: array(float),
    ys: array(float),
  };

  type asJson = {
    .
    "xs": array(float),
    "ys": array(float),
  };

  let hasLength = (t: t): bool => t.xs |> E.A.length > 0;

  let empty: t = {xs: [||], ys: [||]};

  let toJson = (t: t): asJson => {"xs": t.xs, "ys": t.ys};
  let fromJson = (json: asJson): t => {xs: json##xs, ys: json##ys};

  module JS = {
    [@bs.deriving abstract]
    type distJs = {
      xs: array(float),
      ys: array(float),
    };

    let fromDist = (d: t) => distJs(~xs=d.xs, ~ys=d.ys);
    let toDist = (d: distJs) => {xs: xsGet(d), ys: ysGet(d)};

    let doAsDist = (f, d: t) => d |> fromDist |> f |> toDist;
    [@bs.module "./stats.js"] external cdfToPdf: distJs => distJs = "cdfToPdf";
    [@bs.module "./stats.js"]
    external findY: (float, distJs) => float = "findY";
    [@bs.module "./stats.js"]
    external findX: (float, distJs) => float = "findX";

    [@bs.module "./stats.js"] external mean: array(distJs) => distJs = "mean";

    [@bs.module "./stats.js"]
    external distributionScoreDistribution: array(distJs) => distJs =
      "distributionScoreDistribution";

    [@bs.module "./stats.js"]
    external distributionScoreNumber: array(distJs) => float =
      "distributionScoreNumber";

    [@bs.module "./stats.js"] external integral: distJs => float = "integral";
  };

  let toPdf = (dist: t) => dist |> JS.doAsDist(JS.cdfToPdf);

  let requireLength = (dist: t) => dist |> hasLength ? Some(dist) : None;

  let mean = (dists: array(t)) =>
    JS.mean(dists |> Array.map(JS.fromDist)) |> JS.toDist;

  let distributionScoreDistribution = (dists: array(t)) => {
    JS.distributionScoreDistribution(dists |> Array.map(JS.fromDist))
    |> JS.toDist
    |> requireLength;
  };

  let distributionScoreNumber = (dists: array(t)) => {
    JS.distributionScoreNumber(dists |> Array.map(JS.fromDist));
  };

  let findX = (y: float, dist: t) => dist |> JS.fromDist |> JS.findX(y);
  let findY = (x: float, dist: t) => dist |> JS.fromDist |> JS.findY(x);
  let integral = (dist: t) => dist |> JS.fromDist |> JS.integral;
};

module Dists = {
  type t = array(Dist.t);
  let minX = (x: float, dists: t) =>
    dists |> Array.map(Dist.findX(x)) |> E.FloatArray.min;
  let maxX = (x: float, dists: t) =>
    dists |> Array.map(Dist.findX(x)) |> E.FloatArray.max;
};
