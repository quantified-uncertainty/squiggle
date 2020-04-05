type assumption =
  | ADDS_TO_1
  | ADDS_TO_CORRECT_PROBABILITY;

type assumptions = {
  continuous: assumption,
  discrete: assumption,
  discreteProbabilityMass: option(float),
};

let buildSimple = (~continuous: option(DistTypes.continuousShape), ~discrete): option(DistTypes.shape) => {
  let continuous = continuous |> E.O.default(Distributions.Continuous.make(`Linear, {xs: [||], ys: [||]}))
  let cLength =
    continuous
    |> Distributions.Continuous.getShape
    |> XYShape.T.xs
    |> E.A.length;
  let dLength = discrete |> XYShape.T.xs |> E.A.length;
  switch (cLength, dLength) {
  | (0 | 1, 0) => None
  | (0 | 1, _) => Some(Discrete(discrete))
  | (_, 0) => Some(Continuous(continuous))
  | (_, _) =>
    let discreteProbabilityMassFraction =
      Distributions.Discrete.T.Integral.sum(~cache=None, discrete);
    let discrete =
      Distributions.Discrete.T.scaleToIntegralSum(~intendedSum=1.0, discrete);
    let continuous =
      Distributions.Continuous.T.scaleToIntegralSum(
        ~intendedSum=1.0,
        continuous,
      );
    let mixedDist =
      Distributions.Mixed.make(
        ~continuous,
        ~discrete,
        ~discreteProbabilityMassFraction,
      );
    Some(Mixed(mixedDist));
  };
};


// TODO: Delete, only being used in tests
let build = (~continuous, ~discrete, ~assumptions) =>
  switch (assumptions) {
  | {
      continuous: ADDS_TO_CORRECT_PROBABILITY,
      discrete: ADDS_TO_CORRECT_PROBABILITY,
      discreteProbabilityMass: Some(r),
    } =>
    // TODO: Fix this, it's wrong :(
    Some(
      Distributions.Mixed.make(
        ~continuous,
        ~discrete,
        ~discreteProbabilityMassFraction=r,
      ),
    )

  | {
      continuous: ADDS_TO_1,
      discrete: ADDS_TO_1,
      discreteProbabilityMass: Some(r),
    } =>
    Some(
      Distributions.Mixed.make(
        ~continuous,
        ~discrete,
        ~discreteProbabilityMassFraction=r,
      ),
    )

  | {
      continuous: ADDS_TO_1,
      discrete: ADDS_TO_1,
      discreteProbabilityMass: None,
    } =>
    None

  | {
      continuous: ADDS_TO_CORRECT_PROBABILITY,
      discrete: ADDS_TO_1,
      discreteProbabilityMass: None,
    } =>
    None

  | {
      continuous: ADDS_TO_1,
      discrete: ADDS_TO_CORRECT_PROBABILITY,
      discreteProbabilityMass: None,
    } =>
    let discreteProbabilityMassFraction =
      Distributions.Discrete.T.Integral.sum(~cache=None, discrete);
    let discrete =
      Distributions.Discrete.T.scaleToIntegralSum(~intendedSum=1.0, discrete);
    Some(
      Distributions.Mixed.make(
        ~continuous,
        ~discrete,
        ~discreteProbabilityMassFraction,
      ),
    );
  | _ => None
  };