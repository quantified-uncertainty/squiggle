open DistributionTypes;

module Domain = {
  let excludedProbabilityMass = (t: DistributionTypes.domain) => {
    switch (t) {
    | Complete => 1.0
    | LeftLimited({excludingProbabilityMass}) => excludingProbabilityMass
    | RightLimited({excludingProbabilityMass}) => excludingProbabilityMass
    | LeftAndRightLimited(
        {excludingProbabilityMass: l},
        {excludingProbabilityMass: r},
      ) =>
      l +. r
    };
  };

  let initialProbabilityMass = (t: DistributionTypes.domain) => {
    switch (t) {
    | Complete
    | RightLimited(_) => 0.0
    | LeftLimited({excludingProbabilityMass}) => excludingProbabilityMass
    | LeftAndRightLimited({excludingProbabilityMass}, _) => excludingProbabilityMass
    };
  };

  let normalizeProbabilityMass = (t: DistributionTypes.domain) => {
    1. /. excludedProbabilityMass(t);
  };
};

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
    let newShape =
      switch (shape) {
      | Some({
          continuous: {xs: [||], ys: [||]},
          discrete: {xs: [||], ys: [||]},
        }) =>
        None
      | Some({continuous, discrete: {xs: [||], ys: [||]}}) =>
        Some(Continuous(continuous))
      | Some({continuous: {xs: [||], ys: [||]}, discrete}) =>
        Some(Discrete(discrete))
      | Some(shape) => Some(Mixed(shape))
      | _ => None
      };

    newShape
    |> E.O.fmap((shape: DistributionTypes.pointsType) =>
         make(
           ~generationSource=Shape(shape),
           ~probabilityType=Cdf,
           ~domain=t.domain,
           ~unit=t.unit,
           (),
         )
       );
  | Shape(_) => Some(t)
  };
};

let normalize = (t: genericDistribution): option(genericDistribution) => {
  switch (t.generationSource) {
  | Shape(shape) =>
    Shape.PointsType.normalizePdf(shape)
    |> E.O.fmap(shape => {...t, generationSource: Shape(shape)})
  | GuesstimatorString(_) => Some(t)
  };
};

let yIntegral = (t: DistributionTypes.genericDistribution, x) => {
  let addInitialMass = n => n +. Domain.initialProbabilityMass(t.domain);
  let normalize = n => n *. Domain.normalizeProbabilityMass(t.domain);
  switch (t) {
  | {generationSource: Shape(shape)} =>
    Shape.PointsType.yIntegral(shape, x)
    |> E.O.fmap(addInitialMass)
    |> E.O.fmap(normalize)
  | _ => None
  };
};

// TODO: This obviously needs to be fleshed out a lot.
let integrate = (t: DistributionTypes.genericDistribution) => {
  switch (t) {
  | {probabilityType: Pdf, generationSource: Shape(shape), domain, unit} =>
    Some({
      generationSource: Shape(shape),
      probabilityType: Pdf,
      domain,
      unit,
    })
  | _ => None
  };
};