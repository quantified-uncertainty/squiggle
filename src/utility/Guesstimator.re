module Internals = {
  [@bs.deriving abstract]
  type discrete = {
    xs: array(float),
    ys: array(float),
  };

  let jsToDistDiscrete = (d: discrete): DistTypes.discreteShape => {
    xs: xsGet(d),
    ys: ysGet(d),
  };

  [@bs.deriving abstract]
  type combined = {
    continuous: CdfLibrary.JS.distJs,
    discrete,
  };

  // todo: Force to be fewer samples
  let toContinous = (r: combined) =>
    continuousGet(r)
    |> CdfLibrary.JS.jsToDist
    |> Distributions.Continuous.fromShape;

  let toDiscrete = (r: combined): DistTypes.xyShape =>
    discreteGet(r) |> jsToDistDiscrete;

  [@bs.module "./GuesstimatorLibrary.js"]
  external toCombinedFormat: (string, int, int) => combined = "run";

  // todo: Format to correct mass, also normalize the pdf.
  let toMixedShape = (r: combined): option(DistTypes.shape) => {
    let continuous =
      toContinous(r) |> Distributions.Continuous.convertToNewLength(100);
    let discrete = toDiscrete(r);
    // let continuousProb =
    //   cont |> Distributions.Continuous.T.Integral.sum(~cache=None);
    // let discreteProb =
    //   d |> Distributions.Discrete.T.Integral.sum(~cache=None);

    let foo = MixedShapeBuilder.buildSimple(~continuous, ~discrete);
    foo;
  };
};

let stringToMixedShape =
    (~string, ~sampleCount=1000, ~outputXYPoints=1000, ()) =>
  Internals.toCombinedFormat(string, sampleCount, outputXYPoints)
  |> Internals.toMixedShape;