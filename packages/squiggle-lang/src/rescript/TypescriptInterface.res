open ForTS__Types
/*
This is meant as a file to contain @genType declarations as needed for Typescript.
I would ultimately want to have all @genType declarations here, vs. other files, but
@genType doesn't play as nicely with renaming Modules and functions as
would be preferable. 

The below few seem to work fine. In the future there's definitely more work to do here.
*/

// For backwards compatibility:
//Alternatives if one wants to keep the old habits
@genType type samplingParams = environment
@genType type squiggleValue_Dist = squiggleValue_Distribution //alternative
@genType type genericDist = squiggleValue_Distribution //alternative
@genType type sampleSetDist = sampleSetDistribution //alternative
@genType type symbolicDist = symbolicDistribution //alternative
@genType type resultDist = result_<distribution, distributionError> //alternative
@genType type resultFloat = result_<float, distributionError> //alternative
@genType type resultString = result_<string, distributionError> //alternative

@genType
let makeSampleSetDist: array<float> => result_<
  sampleSetDist,
  SampleSetDist.sampleSetError,
> = SampleSetDist.make

//TODO: ForTS Interface module candid
@genType
let toPointSet: (
  squiggleValue_Distribution,
  ~xyPointLength: int,
  ~sampleCount: int,
  ~xSelection: DistributionTypes.DistributionOperation.pointsetXSelection=?,
  unit,
) => result_<PointSetTypes.pointSetDist, distributionError> = GenericDist.toPointSet

@genType
type mixedShape = PointSetTypes.mixedShape

@genType
type discreteShape = PointSetTypes.discreteShape

@genType
type continuousShape = PointSetTypes.continuousShape

@genType
let distributionErrorToString = ForTS_Distribution_Error.toString

@genType
let defaultSamplingEnv = ForTS_Distribution.defaultEnvironment

// Umur: opaqe types
// @genType
// type declarationArg = Declaration.arg

// @genType
// type declaration<'a> = Declaration.declaration<'a>
