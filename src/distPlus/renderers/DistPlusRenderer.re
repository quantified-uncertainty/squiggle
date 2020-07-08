let downsampleIfShould =
    (
      {recommendedLength, shouldDownsample}: RenderTypes.DistPlusRenderer.inputs,
      outputs: RenderTypes.ShapeRenderer.Combined.outputs,
      dist,
    ) => {
      let willDownsample =
  shouldDownsample
  && RenderTypes.ShapeRenderer.Combined.methodUsed(outputs) == `Sampling;
    willDownsample ? dist |> DistPlus.T.downsample(recommendedLength) : dist;
};

let run =
    (inputs: RenderTypes.DistPlusRenderer.inputs)
    : RenderTypes.DistPlusRenderer.outputs => {
  let toDist = shape =>
    DistPlus.make(
      ~shape,
      ~domain=inputs.distPlusIngredients.domain,
      ~unit=inputs.distPlusIngredients.unit,
      ~guesstimatorString=Some(inputs.distPlusIngredients.guesstimatorString),
      (),
    )
    |> DistPlus.T.normalize;
  let outputs =
    ShapeRenderer.run({
      samplingInputs: inputs.samplingInputs,
      guesstimatorString: inputs.distPlusIngredients.guesstimatorString,
      symbolicInputs: {
        length: inputs.recommendedLength,
      },
    });
  let shape = outputs |> RenderTypes.ShapeRenderer.Combined.getShape;
  let dist =
    shape |> E.O.fmap(toDist) |> E.O.fmap(downsampleIfShould(inputs, outputs));
  RenderTypes.DistPlusRenderer.Outputs.make(outputs, dist);
};
