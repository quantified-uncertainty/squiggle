let truncateIfShould =
    (
      {recommendedLength, shouldTruncate}: RenderTypes.DistPlusRenderer.inputs,
      outputs: RenderTypes.ShapeRenderer.Combined.outputs,
      dist,
    ) => {
      let willTruncate = 
  shouldTruncate
  && RenderTypes.ShapeRenderer.Combined.methodUsed(outputs) == `Sampling;
    willTruncate ? dist |> Distributions.DistPlus.T.truncate(recommendedLength) : dist;
};

let run =
    (inputs: RenderTypes.DistPlusRenderer.inputs)
    : RenderTypes.DistPlusRenderer.outputs => {
  let toDist = shape =>
    Distributions.DistPlus.make(
      ~shape,
      ~domain=inputs.distPlusIngredients.domain,
      ~unit=inputs.distPlusIngredients.unit,
      ~guesstimatorString=Some(inputs.distPlusIngredients.guesstimatorString),
      (),
    )
    |> Distributions.DistPlus.T.scaleToIntegralSum(~intendedSum=1.0);
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
    shape |> E.O.fmap(toDist) |> E.O.fmap(truncateIfShould(inputs, outputs));
  RenderTypes.DistPlusRenderer.Outputs.make(outputs, dist);
};