/*
This is meant as a file to contain @genType declarations as needed for Typescript.
I would ultimately want to have all @genType declarations here, vs. other files, but
@genType doesn't play as nicely with renaming Modules and functions as
would be preferable. 

The below few seem to work fine. In the future there's definitely more work to do here.
*/

@genType
type samplingParams = DistributionOperation.env

@genType
type genericDist = DistributionTypes.genericDist

@genType
type distributionError = DistributionTypes.error

@genType
type resultDist = result<genericDist, distributionError>

@genType
type resultFloat = result<float, distributionError>

@genType
type resultString = result<string, distributionError>

@genType
let makeSampleSetDist = SampleSetDist.make

@genType
let evaluate = Reducer.evaluate

@genType
let evaluateUsingExternalBindings = Reducer.evaluateUsingExternalBindings

@genType
type expressionValue = ReducerInterface_ExpressionValue.expressionValue

@genType
type errorValue = Reducer_ErrorValue.errorValue

@genType
let toPointSet = GenericDist.toPointSet

@genType
type mixedShape = PointSetTypes.mixedShape

@genType
type discreteShape = PointSetTypes.discreteShape

@genType
type continuousShape = PointSetTypes.continuousShape

@genType
let errorValueToString = Reducer_ErrorValue.errorToString

@genType
let distributionErrorToString = DistributionTypes.Error.toString

@genType
type internalCode = ReducerInterface_ExpressionValue.internalCode
