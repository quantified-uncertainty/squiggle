open DistributionTypes;

let make =
    (~generationSource, ~domain=Complete, ~unit=UnspecifiedDistribution, ())
    : genericDistribution => {
  generationSource,
  domain,
  unit,
};

let toComplexPower = (~sampleCount, t: genericDistribution) => {
  let shape =
    switch (t.generationSource) {
    | GuesstimatorString(s) =>
      Guesstimator.stringToMixedShape(~string=s, ~sampleCount, ())
      |> E.O.bind(_, DistFunctor.Mixed.clean)
    | Shape(shape) => Some(shape)
    };
  shape
  |> E.O.fmap(shape =>
       DistFunctor.ComplexPower.make(
         ~shape,
         ~domain=t.domain,
         ~unit=t.unit,
         ~guesstimatorString=None,
         (),
       )
     );
};