module JS = {
  [@bs.deriving abstract]
  type distJs = {
    xs: array(float),
    ys: array(float),
  };

  let distToJs = (d: Types.ContinuousDistribution.t) =>
    distJs(~xs=d.xs, ~ys=d.ys);

  let jsToDist = (d: distJs): Types.ContinuousDistribution.t => {
    xs: xsGet(d),
    ys: ysGet(d),
  };

  let doAsDist = (f, d: Types.ContinuousDistribution.t) =>
    d |> distToJs |> f |> jsToDist;

  [@bs.module "./CdfLibrary.js"]
  external cdfToPdf: distJs => distJs = "cdfToPdf";

  [@bs.module "./CdfLibrary.js"]
  external pdfToCdf: distJs => distJs = "pdfToCdf";

  [@bs.module "./CdfLibrary.js"]
  external findY: (float, distJs) => float = "findY";

  [@bs.module "./CdfLibrary.js"]
  external findX: (float, distJs) => float = "findX";

  [@bs.module "./CdfLibrary.js"]
  external integral: distJs => float = "integral";

  [@bs.module "./CdfLibrary.js"]
  external differentialEntropy: (int, distJs) => distJs =
    "differentialEntropy";

  [@bs.module "./CdfLibrary.js"]
  external scoreNonMarketCdfCdf: (int, distJs, distJs, float) => distJs =
    "scoreNonMarketCdfCdf";

  [@bs.module "./GuesstimatorLibrary.js"]
  external toGuesstimator: (string, int) => distJs = "run";
};

module Distribution = {
  let toPdf = dist => dist |> JS.doAsDist(JS.cdfToPdf);
  let toCdf = dist => dist |> JS.doAsDist(JS.cdfToPdf);
  let findX = (y, dist) => dist |> JS.distToJs |> JS.findX(y);
  let findY = (x, dist) => dist |> JS.distToJs |> JS.findY(x);
  let fromString = (str: string, sampleCount: int) =>
    JS.toGuesstimator(str, sampleCount) |> JS.jsToDist;
  let integral = dist => dist |> JS.distToJs |> JS.integral;
  let differentialEntropy = (maxCalculationLength, dist) =>
    dist
    |> JS.doAsDist(JS.differentialEntropy(maxCalculationLength))
    |> integral;
};