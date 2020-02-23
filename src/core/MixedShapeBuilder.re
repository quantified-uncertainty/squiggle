type assumption =
  | ADDS_TO_1
  | ADDS_TO_CORRECT_PROBABILITY;

type assumptions = {
  continuous: assumption,
  discrete: assumption,
  discreteProbabilityMass: option(float),
};

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