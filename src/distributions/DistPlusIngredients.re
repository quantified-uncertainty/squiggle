open DistTypes;

let make =
    (~guesstimatorString, ~domain=Complete, ~unit=UnspecifiedDistribution, ())
    : distPlusIngredients => {
  guesstimatorString,
  domain,
  unit,
};

let toDistPlus =
    (~sampleCount=1000, ~outputXYPoints=1000, t: distPlusIngredients)
    : option(distPlus) => {
  let shape =
    Guesstimator.stringToMixedShape(
      ~string=t.guesstimatorString,
      ~sampleCount,
      ~outputXYPoints,
      (),
    );
  Js.log2("Line 21 with shape:", shape);
  let ss =
    shape
    |> E.O.fmap(
         Distributions.DistPlus.make(
           ~shape=_,
           ~domain=t.domain,
           ~unit=t.unit,
           ~guesstimatorString=None,
           (),
         ),
       );
  ss;
};