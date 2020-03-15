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
  external samplesToContinuousPdf:
    (array(float), int, int) => CdfLibrary.JS.distJs =
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

let toMixed = (string, sampleCount, returnLength, width) => {
  let samples = Internals.stringToSamples(string, sampleCount);
  let length = samples |> E.A.length;
  Array.sort(compare, samples);
  let items =
    E.A.uniq(samples)
    |> E.A.fmap(r => (r, samples |> E.A.filter(n => n == r) |> E.A.length));
  let (discretePart, continuousPart) =
    Belt.Array.partition(items, ((_, count)) => count > 1);
  let discrete: DistTypes.xyShape =
    discretePart
    |> E.A.fmap(((x, count)) =>
         (x, float_of_int(count) /. float_of_int(length))
       )
    |> XYShape.T.fromZippedArray;
  let pdf: DistTypes.xyShape =
    continuousPart |> E.A.length > 20
      ? {
        Internals.samplesToContinuousPdf(samples, returnLength, width)
        |> CdfLibrary.JS.jsToDist;
      }
      : {xs: [||], ys: [||]};
  let continuous = pdf |> Distributions.Continuous.fromShape;
  let shape = MixedShapeBuilder.buildSimple(~continuous, ~discrete);
  shape;
};