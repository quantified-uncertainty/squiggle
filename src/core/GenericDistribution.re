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
};

let normalizeCdf = (t: DistributionTypes.pointsType) => {
  switch (t) {
  | Mixed({continuous, discrete, discreteProbabilityMassFraction}) =>
    Mixed({
      continuous: continuous |> Shape.Continuous.normalizeCdf,
      discrete: discrete |> Shape.Discrete.scaleYToTotal(1.0),
      discreteProbabilityMassFraction,
    })
  | Discrete(d) => Discrete(d |> Shape.Discrete.scaleYToTotal(1.0))
  | Continuous(continuousShape) =>
    Continuous(Shape.Continuous.normalizeCdf(continuousShape))
  };
};

let normalizePdf = (t: DistributionTypes.pointsType) => {
  switch (t) {
  | Mixed({continuous, discrete, discreteProbabilityMassFraction}) =>
    continuous
    |> Shape.Continuous.normalizePdf
    |> E.O.fmap(r =>
         Mixed({
           continuous: r,
           discrete: discrete |> Shape.Discrete.scaleYToTotal(1.0),
           discreteProbabilityMassFraction,
         })
       )
  | Discrete(d) => Some(Discrete(d |> Shape.Discrete.scaleYToTotal(1.0)))
  | Continuous(continuousShape) =>
    continuousShape
    |> Shape.Continuous.normalizePdf
    |> E.O.fmap(r => Continuous(r))
  };
};

let normalize = (t: genericDistribution): option(genericDistribution) => {
  switch (t.generationSource) {
  | Shape(shape) =>
    normalizePdf(shape)
    |> E.O.fmap(shape => {...t, generationSource: Shape(shape)})
  | GuesstimatorString(_) => Some(t)
  };
};

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

let yIntegral = (t: DistributionTypes.genericDistribution, x) => {
  let addInitialMass = n => n +. initialProbabilityMass(t.domain);
  let normalize = n => n *. normalizeProbabilityMass(t.domain);
  switch (t) {
  | {generationSource: Shape(shape)} =>
    Shape.Any.yIntegral(shape, x)
    |> E.O.fmap(addInitialMass)
    |> E.O.fmap(normalize)
  | _ => None
  };
};

let integrate = (t: DistributionTypes.genericDistribution) => {
  switch (t) {
  | {probabilityType: Pdf, generationSource: Shape(shape), domain, unit} =>
    Some({
      generationSource: Shape(shape),
      probabilityType: Cdf,
      domain,
      unit,
    })
  | {probabilityType: Cdf, generationSource, domain, unit} => None
  | _ => None
  };
};