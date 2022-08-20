open ForTS__Types
/*
This is meant as a file to contain @genType declarations as needed for Typescript.
I would ultimately want to have all @genType declarations here, vs. other files, but
@genType doesn't play as nicely with renaming Modules and functions as
would be preferable. 

The below few seem to work fine. In the future there's definitely more work to do here.
*/

@genType
type samplingParams = environment

@genType
type genericDist = squiggleValue_Distribution

@genType
type sampleSetDist = SampleSetDist.t

@genType
type symbolicDist = SymbolicDistTypes.symbolicDist

@genType
type resultDist = result_<genericDist, distributionError>

@genType
type resultFloat = result_<float, distributionError>

@genType
type resultString = result_<string, distributionError>

//TODO: ForTS Interface module candid
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

// ForTS_Distributions_Error.toString
// @genType
// let distributionErrorToString = DistributionTypes.Error.toString

@genType
let defaultSamplingEnv = DistributionOperation.defaultEnv

@genType
type declarationArg = Declaration.arg

@genType
type declaration<'a> = Declaration.declaration<'a>
