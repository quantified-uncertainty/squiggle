open DistributionTypes;

let make =
    (
      ~generationSource,
      ~probabilityType=Pdf,
      ~domain=Complete,
      ~unit=UnspecifiedDistribution,
      (),
    )
    : genericDistribution => {
  generationSource,
  probabilityType,
  domain,
  unit,
};

let toComplexPower =
    (~sampleCount, t: genericDistribution): option(complexPower) => {
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