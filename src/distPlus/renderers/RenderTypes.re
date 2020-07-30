module MS = Belt.Map.String;

module ShapeRenderer = {
  module Sampling = {
    type inputs = {
      sampleCount: option(int),
      outputXYPoints: option(int),
      kernelWidth: option(float),
    };
    module Inputs = {
      let defaultSampleCount = 10000;
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
  };
};

module DistPlusRenderer = {
  let defaultRecommendedLength = 10000;
  let defaultShouldDownsample = true;
  type ingredients = {
    guesstimatorString: string,
    domain: DistTypes.domain,
    unit: DistTypes.distributionUnit,
  };
  module Ingredients = {
    type t = ingredients;
    let make =
        (
          ~guesstimatorString,
          ~domain=DistTypes.Complete,
          ~unit=DistTypes.UnspecifiedDistribution,
          (),
        )
        : t => {
      guesstimatorString,
      domain,
      unit,
    };
  };
  type inputs = {
    distPlusIngredients: ingredients,
    samplingInputs: ShapeRenderer.Sampling.inputs,
    recommendedLength: int,
    shouldDownsample: bool,
    inputVariables: MS.t(ExpressionTypes.ExpressionTree.node),
  };
  let make =
      (
        ~samplingInputs=ShapeRenderer.Sampling.Inputs.empty,
        ~recommendedLength=defaultRecommendedLength,
        ~shouldDownsample=defaultShouldDownsample,
        ~distPlusIngredients,
        ~inputVariables=[||]->Belt.Map.String.fromArray,
        (),
      )
      : inputs => {
    distPlusIngredients,
    samplingInputs,
    recommendedLength,
    shouldDownsample,
    inputVariables,
  };
};
