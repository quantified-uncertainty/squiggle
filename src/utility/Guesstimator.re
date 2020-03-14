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
  external toCombinedFormat: (string, int, int, int) => combined = "run";

  [@bs.module "./GuesstimatorLibrary.js"]
  external stringToSamples: (string, int) => array(float) = "stringToSamples";

  [@bs.module "./GuesstimatorLibrary.js"]
  external samplesToContinuousPdf: (array(float), int, int) => array(float) =
    "samplesToContinuousPdf";

  // todo: Format to correct mass, also normalize the pdf.
  let toMixedShape =
      (~truncateTo=Some(500), r: combined): option(DistTypes.shape) => {
    let continuous = toContinous(r);
    let continuous =
      switch (truncateTo) {
      | Some(t) =>
        continuous |> Distributions.Continuous.convertToNewLength(t)
      | None => continuous
      };
    let discrete = toDiscrete(r);
    // let continuousProb =
    //   cont |> Distributions.Continuous.T.Integral.sum(~cache=None);
    // let discreteProb =
    //   d |> Distributions.Discrete.T.Integral.sum(~cache=None);

    let shape = MixedShapeBuilder.buildSimple(~continuous, ~discrete);
    shape;
  };
};

let stringToMixedShape =
    (
      ~string,
      ~sampleCount=3000,
      ~outputXYPoints=3000,
      ~width=3000,
      ~truncateTo=Some(500),
      (),
    ) =>
  Internals.toCombinedFormat(string, sampleCount, outputXYPoints, width)
  |> Internals.toMixedShape(~truncateTo);