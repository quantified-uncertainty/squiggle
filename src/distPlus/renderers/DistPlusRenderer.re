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
    ShapeRenderer.run({
      samplingInputs: inputs.samplingInputs,
      guesstimatorString: inputs.distPlusIngredients.guesstimatorString,
      symbolicInputs: {
        length: inputs.recommendedLength,
      },
    });
  output
  |> E.R.fmap((o: RenderTypes.ShapeRenderer.Symbolic.outputs) =>
       toDist(o.shape)
     );
};
