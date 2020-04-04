type primaryInputs = {
  guesstimatorString: string,
  shapeLength: int,
};

module Sampling = {
  type inputs = {
    sampleCount: option(int),
    outputXYPoints: option(int),
    kernelWidth: option(float),
  };
  type samplingStats = {
    sampleCount: int,
    outputXYPoints: int,
    bandwidthXSuggested: float,
    bandwidthUnitSuggested: float,
    bandwidthXImplemented: float,
    bandwidthUnitImplemented: float,
  };
  type outputs = {
    continuousParseParams: option(samplingStats),
    shape: option(ProbExample.DistTypes.shape),
  };
  module Inputs = {
    let defaultSampleCount = 5000;
    let defaultOutputXYPoints = 10000;
    let empty = {sampleCount: None, outputXYPoints: None, kernelWidth: None};

    type fInputs = {
      sampleCount: int,
      outputXYPoints: int,
      kernelWidth: option(float),
    };
    let toF = (i: inputs): fInputs => {
      sampleCount: i.sampleCount |> E.O.default(defaultSampleCount),
      outputXYPoints: i.outputXYPoints |> E.O.default(defaultOutputXYPoints),
      kernelWidth: i.kernelWidth,
    };
  };
};

module Symbolic = {
  type inputs = {length: int};
  type outputs = {
    graph: ProbExample.SymbolicDist.bigDist,
    shape: ProbExample.DistTypes.shape,
  };
  let make = (graph, shape) => {graph, shape};
};

module Combined = {
  type inputs = {
    samplingInputs: Sampling.inputs,
    symbolicInputs: Symbolic.inputs,
    guesstimatorString: string,
  };
  type outputs = {
    symbolic: option(Belt.Result.t(Symbolic.outputs, string)),
    sampling: option(Sampling.outputs),
  };
};

module DistPlus = {
  let defaultRecommendedLength = 10000;
  let defaultShouldTruncate = true;
  type inputs = {
    distPlusIngredients: DistTypes.distPlusIngredients,
    samplingInputs: Sampling.inputs,
    recommendedLength: int,
    shouldTruncate: bool,
  };
  let make =
      (
        ~samplingInputs=Sampling.Inputs.empty,
        ~recommendedLength=defaultRecommendedLength,
        ~shouldTruncate=defaultShouldTruncate,
        ~distPlusIngredients,
        ()
      )
      : inputs => {
    distPlusIngredients,
    samplingInputs,
    recommendedLength,
    shouldTruncate,
  };
};