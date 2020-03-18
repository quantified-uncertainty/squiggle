open DistTypes;

let make =
    (~guesstimatorString, ~domain=Complete, ~unit=UnspecifiedDistribution, ())
    : distPlusIngredients => {
  guesstimatorString,
  domain,
  unit,
};

let toDistPlus =
    (
      ~sampleCount=2000,
      ~outputXYPoints=1500,
      ~truncateTo=Some(300),
      ~kernelWidth=5,
      t: distPlusIngredients,
    )
    : option(distPlus) => {
  let shape =
    Guesstimator.toMixed(
      ~string=t.guesstimatorString,
      ~sampleCount,
      ~outputXYPoints,
      ~kernelWidth,
      (),
    );
  let distPlus =
    shape
    |> E.O.fmap(
         Distributions.DistPlus.make(
           ~shape=_,
           ~domain=t.domain,
           ~unit=t.unit,
           ~guesstimatorString=Some(t.guesstimatorString),
           (),
         ),
       )
    |> E.O.fmap(
         Distributions.DistPlus.T.scaleToIntegralSum(~intendedSum=1.0),
       );
  switch (truncateTo, distPlus) {
  | (Some(t), Some(d)) => Some(d |> Distributions.DistPlus.T.truncate(t))
  | (None, Some(d)) => Some(d)
  | _ => None
  };
};