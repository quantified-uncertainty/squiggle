module ShapeRenderer = {
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
      shape: option(DistTypes.shape),
    };
    module Inputs = {
      let defaultSampleCount = 5000;
      let defaultOutputXYPoints = 10000;
      let empty = {
        sampleCount: None,
        outputXYPoints: None,
        kernelWidth: None,
      };

      type fInputs = {
        sampleCount: int,
        outputXYPoints: int,
        kernelWidth: option(float),
      };
      let toF = (i: inputs): fInputs => {
        sampleCount: i.sampleCount |> E.O.default(defaultSampleCount),
        outputXYPoints:
          i.outputXYPoints |> E.O.default(defaultOutputXYPoints),
        kernelWidth: i.kernelWidth,
      };
    };
  };

  module Symbolic = {
    type inputs = {length: int};
    type outputs = {
      graph: SymbolicDist.bigDist,
      shape: DistTypes.shape,
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
    let methodUsed = ({symbolic, sampling}:outputs) => switch(symbolic, sampling){
      | (Some(Ok(_)), _) => `Symbolic
      | (None, Some({shape: Some(_)})) => `Sampling
      | _ => `None
    }
    let getShape = (r: outputs) =>
      switch (r.symbolic, r.sampling) {
      | (Some(Ok({shape})), _) => Some(shape)
      | (_, Some({shape})) => shape
      | _ => None
      };
  };
};

module DistPlusRenderer = {
  let defaultRecommendedLength = 10000;
  let defaultShouldTruncate = true;
  type ingredients = {
    guesstimatorString: string,
    domain: DistTypes.domain,
    unit: DistTypes.distributionUnit,
  };
  type inputs = {
    distPlusIngredients: ingredients,
    samplingInputs: ShapeRenderer.Sampling.inputs,
    recommendedLength: int,
    shouldTruncate: bool,
  };
  module Ingredients = {
    let make =
        (
          ~guesstimatorString,
          ~domain=DistTypes.Complete,
          ~unit=DistTypes.UnspecifiedDistribution,
          (),
        )
        : ingredients => {
      guesstimatorString,
      domain,
      unit,
    };
  };
  let make =
      (
        ~samplingInputs=ShapeRenderer.Sampling.Inputs.empty,
        ~recommendedLength=defaultRecommendedLength,
        ~shouldTruncate=defaultShouldTruncate,
        ~distPlusIngredients,
        (),
      )
      : inputs => {
    distPlusIngredients,
    samplingInputs,
    recommendedLength,
    shouldTruncate,
  };
  type outputs = {
    shapeRenderOutputs: ShapeRenderer.Combined.outputs,
    distPlus: option(DistTypes.distPlus)
  }
  module Outputs = {
    let distplus = (t:outputs) => t.distPlus
    let shapeRenderOutputs = (t:outputs) => t.shapeRenderOutputs
    let make = (shapeRenderOutputs, distPlus) => {shapeRenderOutputs, distPlus};
  }
};