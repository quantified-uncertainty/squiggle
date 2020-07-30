type inputs = {
  samplingInputs: RenderTypes.ShapeRenderer.Sampling.inputs,
  symbolicInputs: RenderTypes.ShapeRenderer.Symbolic.inputs,
  guesstimatorString: string,
  inputVariables: Belt.Map.String.t(ExpressionTypes.ExpressionTree.node),
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

let run = (inputs: RenderTypes.DistPlusRenderer.inputs) => {
  let output =
    inputsToShape({
      samplingInputs: inputs.samplingInputs,
      guesstimatorString: inputs.distPlusIngredients.guesstimatorString,
      inputVariables: inputs.inputVariables,
      symbolicInputs: {
        length: inputs.recommendedLength,
      },
    });
  output
  |> E.R.fmap((o: outputs) =>
       DistPlus.make(
         ~shape=o.shape,
         ~domain=inputs.distPlusIngredients.domain,
         ~unit=inputs.distPlusIngredients.unit,
         ~guesstimatorString=
           Some(inputs.distPlusIngredients.guesstimatorString),
         (),
       )
     );
};
