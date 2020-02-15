type domainLimit = {
  xPoint: float,
  excludingProbabilityMass: float,
};

type domain =
  | Complete
  | LeftLimited(domainLimit)
  | RightLimited(domainLimit)
  | LeftAndRightLimited(domainLimit, domainLimit);

type continuousShape = {
  xs: array(float),
  ys: array(float),
};

type discreteShape = {
  xs: array(float),
  ys: array(float),
};

type mixedShape = {
  continuous: continuousShape,
  discrete: discreteShape,
  discreteProbabilityMassFraction: float,
};

type pointsType =
  | Mixed(mixedShape)
  | Discrete(discreteShape)
  | Continuous(continuousShape);

type generationSource =
  | GuesstimatorString(string)
  | Shape(pointsType);

type distributionUnit =
  | Unspecified
  | Time(TimeTypes.timeVector);

type probabilityType =
  | Cdf
  | Pdf
  | Arbitrary;

type genericDistribution = {
  generationSource,
  probabilityType,
  domain,
  unit: distributionUnit,
};

module Shape = {
  module Continuous = {
    let fromArrays = (xs, ys): continuousShape => {xs, ys};
  };

  module Discrete = {
    let fromArrays = (xs, ys): continuousShape => {xs, ys};
  };

  module Mixed = {
    let make = (~continuous, ~discrete, ~discreteProbabilityMassFraction) => {
      continuous,
      discrete,
      discreteProbabilityMassFraction,
    };

    module Builder = {
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
            make(~continuous, ~discrete, ~discreteProbabilityMassFraction=r),
          )
        | {
            continuous: ADDS_TO_1,
            discrete: ADDS_TO_1,
            discreteProbabilityMass: Some(r),
          } =>
          Some(
            make(~continuous, ~discrete, ~discreteProbabilityMassFraction=r),
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
          None
        | _ => None
        };
    };
  };
};

module GenericDistribution = {
  let make =
      (
        ~generationSource,
        ~probabilityType=Pdf,
        ~domain=Complete,
        ~unit=Unspecified,
        (),
      )
      : genericDistribution => {
    generationSource,
    probabilityType,
    domain,
    unit,
  };
};