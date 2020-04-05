open DistTypes;

let make =
    (~guesstimatorString, ~domain=Complete, ~unit=UnspecifiedDistribution, ())
    : distPlusIngredients => {
  guesstimatorString,
  domain,
  unit,
};

let truncateIfShould = (inputs: RenderTypes.DistPlusRenderer.inputs, dist) => {
  inputs.shouldTruncate
    ? dist
    : dist |> Distributions.DistPlus.T.truncate(inputs.recommendedLength);
};

let toDistPlus = (inputs: RenderTypes.DistPlusRenderer.inputs): option(distPlus) => {
  let toDist = shape =>
    Distributions.DistPlus.make(
      ~shape,
      ~domain=inputs.distPlusIngredients.domain,
      ~unit=inputs.distPlusIngredients.unit,
      ~guesstimatorString=Some(inputs.distPlusIngredients.guesstimatorString),
      (),
    )
    |> Distributions.DistPlus.T.scaleToIntegralSum(~intendedSum=1.0);
  let shape =
    GuesstimatorToShape.run({
      samplingInputs: inputs.samplingInputs,
      guesstimatorString: inputs.distPlusIngredients.guesstimatorString,
      symbolicInputs: {
        length: inputs.recommendedLength,
      },
    })
    |> GuesstimatorToShape.getShape;
  let dist =
    shape |> E.O.fmap(toDist) |> E.O.fmap(truncateIfShould(inputs));
  dist;
};