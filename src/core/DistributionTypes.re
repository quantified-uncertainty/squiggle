type domainLimit = {
  xPoint: float,
  excludingProbabilityMass: float,
};

type domain =
  | Complete
  | LeftLimited(domainLimit)
  | RightLimited(domainLimit)
  | LeftAndRightLimited(domainLimit, domainLimit);

type xyShape = {
  xs: array(float),
  ys: array(float),
};

type continuousShape = xyShape;
type discreteShape = xyShape;

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