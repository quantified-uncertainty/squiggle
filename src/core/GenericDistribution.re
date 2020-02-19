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

let renderIfNeeded =
    (~sampleCount=1000, t: genericDistribution): option(genericDistribution) => {
  switch (t.generationSource) {
  | GuesstimatorString(s) =>
    let shape = Guesstimator.stringToMixedShape(~string=s, ~sampleCount, ());
    shape
    |> E.O.fmap((shape: DistributionTypes.mixedShape) =>
         make(
           ~generationSource=Shape(Mixed(shape)),
           ~probabilityType=Cdf,
           ~domain=t.domain,
           ~unit=t.unit,
           (),
         )
       );
  | Shape(_) => Some(t)
  };
} /* }*/;

// let getTimeY =
//     (t: genericDistribution, point: TimeTypes.RelativeTimePoint.timeInVector) => {
//   switch (t) {
//   | {
//       generationSource: Shape(shape),
//       probabilityType: Pdf,
//       unit: Time(timeVector),
//     } =>
//     TimeTypes.RelativeTimePoint.toXValue(timeVector, point)
//     |> E.O.fmap(x => Shape.Mixed.getY(t, x))
//   | _ => 2.0
//   };