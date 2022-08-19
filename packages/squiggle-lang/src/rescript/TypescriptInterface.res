open ForTS__Types
/*
This is meant as a file to contain @genType declarations as needed for Typescript.
I would ultimately want to have all @genType declarations here, vs. other files, but
@genType doesn't play as nicely with renaming Modules and functions as
would be preferable. 

The below few seem to work fine. In the future there's definitely more work to do here.
*/

@genType
type samplingParams = GenericDist.env

@genType
type genericDist = DistributionTypes.genericDist

@genType
type sampleSetDist = SampleSetDist.t

@genType
type symbolicDist = SymbolicDistTypes.symbolicDist

@genType
type distributionError = DistributionTypes.error

@genType
type resultDist = result_<genericDist, distributionError>

@genType
type resultFloat = result_<float, distributionError>

@genType
type resultString = result_<string, distributionError>

@genType
let makeSampleSetDist = SampleSetDist.make

@genType
let toPointSet = GenericDist.toPointSet

@genType
type mixedShape = PointSetTypes.mixedShape

@genType
type discreteShape = PointSetTypes.discreteShape

@genType
type continuousShape = PointSetTypes.continuousShape

@genType
let distributionErrorToString = DistributionTypes.Error.toString

@genType
let defaultSamplingEnv = DistributionOperation.defaultEnv

@genType
type declarationArg = Declaration.arg

@genType
type declaration<'a> = Declaration.declaration<'a>
