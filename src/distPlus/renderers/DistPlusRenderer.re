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
  // let symbolicDist: ExpressionTypes.ExpressionTree.node = `SymbolicDist(`Float(30.0));
  //     inputVariables: [|("p", symbolicDist)|] -> Belt.Map.String.fromArray,
  let output =
    ShapeRenderer.run({
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
