module Internals = {
  [@bs.deriving abstract]
  type discrete = {
    xs: array(float),
    ys: array(float),
  };

  let jsToDistDiscrete = (d: discrete): DistributionTypes.discreteShape => {
    xs: xsGet(d),
    ys: ysGet(d),
  };

  [@bs.deriving abstract]
  type combined = {
    continuous: CdfLibrary.JS.distJs,
    discrete,
  };

  let toContinous = (r: combined) =>
    continuousGet(r) |> CdfLibrary.JS.jsToDist |> Shape.Continuous.fromShape;

  let toDiscrete = (r: combined): DistributionTypes.xyShape =>
    discreteGet(r) |> jsToDistDiscrete;

  [@bs.module "./GuesstimatorLibrary.js"]
  external toCombinedFormat: (string, int) => combined = "run";

  // todo: Format to correct mass, also normalize the pdf.
  let toMixedShape = (r: combined): option(DistributionTypes.mixedShape) => {
    let assumptions: MixedShapeBuilder.assumptions = {
      continuous: ADDS_TO_1,
      discrete: ADDS_TO_CORRECT_PROBABILITY,
      discreteProbabilityMass: None,
    };
    MixedShapeBuilder.build(
      ~continuous=toContinous(r),
      ~discrete=toDiscrete(r),
      ~assumptions,
    );
  };
};

let stringToMixedShape = (~string, ~sampleCount=1000, ()) =>
  Internals.toCombinedFormat(string, sampleCount) |> Internals.toMixedShape;