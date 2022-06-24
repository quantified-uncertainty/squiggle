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
type sampleSetDist = SampleSetDist.t

@genType
type symbolicDist = SymbolicDistTypes.symbolicDist

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
let evaluateUsingOptions = Reducer.evaluateUsingOptions

@genType
let parse = Reducer_Peggy_Parse.parse

@genType
let evaluatePartialUsingExternalBindings = Reducer.evaluatePartialUsingExternalBindings

@genType
type externalBindings = Reducer.externalBindings

@genType
type expressionValue = ReducerInterface_ExternalExpressionValue.t

@genType
type recordEV = ReducerInterface_ExternalExpressionValue.record

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
type lambdaValue = ReducerInterface_ExternalExpressionValue.lambdaValue

@genType
type lambdaDeclaration = ReducerInterface_ExternalExpressionValue.lambdaDeclaration

@genType
let defaultSamplingEnv = DistributionOperation.defaultEnv

@genType
type environment = ReducerInterface_ExternalExpressionValue.environment

@genType
let defaultEnvironment = ReducerInterface_ExternalExpressionValue.defaultEnvironment

@genType
let foreignFunctionInterface = Reducer.foreignFunctionInterface

@genType
type declarationArg = Declaration.arg

@genType
type declaration<'a> = Declaration.declaration<'a>
