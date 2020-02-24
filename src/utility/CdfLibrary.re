module JS = {
  [@bs.deriving abstract]
  type distJs = {
    xs: array(float),
    ys: array(float),
  };

  let distToJs = (d: DistTypes.xyShape) => distJs(~xs=d.xs, ~ys=d.ys);

  let jsToDist = (d: distJs): DistTypes.xyShape => {
    xs: xsGet(d),
    ys: ysGet(d),
  };

  let doAsDist = (f, d: DistTypes.xyShape) => d |> distToJs |> f |> jsToDist;

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
  external convertToNewLength: (int, distJs) => distJs = "convertToNewLength";
};

module Distribution = {
  let convertToNewLength = (int, {xs, _} as dist: DistTypes.xyShape) =>
    switch (E.A.length(xs)) {
    | 0
    | 1 => dist
    | _ => dist |> JS.doAsDist(JS.convertToNewLength(int))
    };
  let toPdf = dist => dist |> JS.doAsDist(JS.cdfToPdf);
  let toCdf = dist => dist |> JS.doAsDist(JS.pdfToCdf);
  let findX = (y, dist) => dist |> JS.distToJs |> JS.findX(y);
  let findY = (x, dist) => dist |> JS.distToJs |> JS.findY(x);
  let integral = dist => dist |> JS.distToJs |> JS.integral;
  let differentialEntropy = (maxCalculationLength, dist) =>
    dist
    |> JS.doAsDist(JS.differentialEntropy(maxCalculationLength))
    |> integral;
};