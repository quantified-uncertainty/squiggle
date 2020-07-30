let inputsToShape = (inputs: RenderTypes.ShapeRenderer.Combined.inputs) => {
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
       |> E.R.fmap(RenderTypes.ShapeRenderer.Symbolic.make(g))
     );
};

let run = (inputs: RenderTypes.DistPlusRenderer.inputs) => {
  let toDist = shape =>
    DistPlus.make(
      ~shape,
      ~domain=inputs.distPlusIngredients.domain,
      ~unit=inputs.distPlusIngredients.unit,
      ~guesstimatorString=Some(inputs.distPlusIngredients.guesstimatorString),
      (),
    )
    |> DistPlus.T.normalize;
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
  |> E.R.fmap((o: RenderTypes.ShapeRenderer.Symbolic.outputs) =>
       toDist(o.shape)
     );
};
