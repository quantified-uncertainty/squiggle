open DistTypes;

let make =
    (~guesstimatorString, ~domain=Complete, ~unit=UnspecifiedDistribution, ())
    : distPlusIngredients => {
  guesstimatorString,
  domain,
  unit,
};

let applyTruncation = (truncateTo, distPlus) =>
  switch (truncateTo, distPlus) {
  | (Some(t), Some(d)) => Some(d |> Distributions.DistPlus.T.truncate(t))
  | (None, Some(d)) => Some(d)
  | _ => None
  };

      // ~samplingInputs=RenderTypes.Sampling.Inputs.empty,
      // ~truncateTo: option(int),
      // t: distPlusIngredients,
//Make truncation optional
let toDistPlus =
    (
      inputs:RenderTypes.DistPlus.inputs
    )
    : option(distPlus) => {
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
    GuesstimatorToShape.run(
      ~renderingInputs={
        guesstimatorString: inputs.distPlusIngredients.guesstimatorString,
        shapeLength: inputs.recommendedLength,
      },
      ~samplingInputs=inputs.samplingInputs,
    )
    |> GuesstimatorToShape.getShape;
  //TODO: Apply truncation
  let foo = shape |> E.O.fmap(toDist);
  foo;
};