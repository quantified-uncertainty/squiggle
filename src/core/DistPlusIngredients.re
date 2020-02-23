open DistributionTypes;

let make =
    (~guesstimatorString, ~domain=Complete, ~unit=UnspecifiedDistribution, ())
    : distPlusIngredients => {
  guesstimatorString,
  domain,
  unit,
};

let toDistPlus = (~sampleCount, t: distPlusIngredients) => {
  let shape =
    Guesstimator.stringToMixedShape(
      ~string=t.guesstimatorString,
      ~sampleCount,
      (),
    )
    |> E.O.bind(_, DistFunctor.Mixed.clean);
  shape
  |> E.O.fmap(shape =>
       DistFunctor.DistPlus.make(
         ~shape,
         ~domain=t.domain,
         ~unit=t.unit,
         ~guesstimatorString=None,
         (),
       )
     );
};