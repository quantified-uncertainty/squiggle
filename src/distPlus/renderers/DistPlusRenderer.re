// TODO: This setup is more confusing than it should be, there's more work to do in cleanup here.
module Inputs = {
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
    samplingInputs: RenderTypes.ShapeRenderer.Sampling.inputs,
    recommendedLength: int,
    inputVariables: Belt.Map.String.t(ExpressionTypes.ExpressionTree.node),
  };
  let empty: RenderTypes.ShapeRenderer.Sampling.inputs = {
    sampleCount: None,
    outputXYPoints: None,
    kernelWidth: None,
  };

  let make =
      (
        ~samplingInputs=empty,
        ~recommendedLength=defaultRecommendedLength,
        ~distPlusIngredients,
        ~inputVariables=[||]->Belt.Map.String.fromArray,
        (),
      )
      : inputs => {
    distPlusIngredients,
    samplingInputs,
    recommendedLength,
    inputVariables,
  };
};

module Internals = {
  type inputs = {
    samplingInputs: RenderTypes.ShapeRenderer.Sampling.inputs,
    symbolicInputs: RenderTypes.ShapeRenderer.Symbolic.inputs,
    guesstimatorString: string,
    inputVariables: Belt.Map.String.t(ExpressionTypes.ExpressionTree.node),
  };

  let distPlusRenderInputsToInputs = (inputs: Inputs.inputs): inputs => {
    {
      samplingInputs: inputs.samplingInputs,
      guesstimatorString: inputs.distPlusIngredients.guesstimatorString,
      inputVariables: inputs.inputVariables,
      symbolicInputs: {
        length: inputs.recommendedLength,
      },
    };
  };

  type outputs = {
    graph: ExpressionTypes.ExpressionTree.node,
    shape: DistTypes.shape,
  };
  let makeOutputs = (graph, shape): outputs => {graph, shape};

  let inputsToShape = (inputs: inputs) => {
    MathJsParser.fromString(inputs.guesstimatorString, inputs.inputVariables)
    |> E.R.bind(_, g =>
         ExpressionTree.toShape(
           inputs.symbolicInputs.length,
           {
             sampleCount:
               inputs.samplingInputs.sampleCount |> E.O.default(10000),
             outputXYPoints:
               inputs.samplingInputs.outputXYPoints |> E.O.default(10000),
             kernelWidth: inputs.samplingInputs.kernelWidth,
           },
           g,
         )
         |> E.R.fmap(makeOutputs(g))
       );
  };

  let outputToDistPlus = (inputs: Inputs.inputs, outputs: outputs) => {
    DistPlus.make(
      ~shape=outputs.shape,
      ~domain=inputs.distPlusIngredients.domain,
      ~unit=inputs.distPlusIngredients.unit,
      ~guesstimatorString=Some(inputs.distPlusIngredients.guesstimatorString),
      (),
    );
  };
};

let run = (inputs: Inputs.inputs) => {
  inputs
  |> Internals.distPlusRenderInputsToInputs
  |> Internals.inputsToShape
  |> E.R.fmap(Internals.outputToDistPlus(inputs));
};
