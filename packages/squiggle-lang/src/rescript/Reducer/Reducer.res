module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module ExternalExpressionValue = ReducerInterface_ExternalExpressionValue

type environment = ReducerInterface_InternalExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue
type expressionValue = ExternalExpressionValue.t
type externalBindings = ReducerInterface_ExternalExpressionValue.externalBindings
type lambdaValue = ExternalExpressionValue.lambdaValue

/*
  Use Reducer_Project instead 
*/

let defaultEnvironment = ExternalExpressionValue.defaultEnvironment

// let defaultExternalBindings = ReducerInterface_StdLib.externalStdLib
