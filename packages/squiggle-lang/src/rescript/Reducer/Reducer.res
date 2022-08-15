module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module ExternalExpressionValue = ReducerInterface_ExternalExpressionValue
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Lambda = Reducer_Expression_Lambda

type environment = ReducerInterface_InternalExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue
type expressionValue = ExternalExpressionValue.t
type externalBindings = ReducerInterface_ExternalExpressionValue.externalBindings
type lambdaValue = ExternalExpressionValue.lambdaValue

let evaluate = Expression.evaluate
let evaluateUsingOptions = Expression.evaluateUsingOptions
let evaluatePartialUsingExternalBindings = Expression.evaluatePartialUsingExternalBindings
let parse = Expression.parse

let foreignFunctionInterface = (
  lambdaValue: ExternalExpressionValue.lambdaValue,
  argArray: array<expressionValue>,
  environment: ExternalExpressionValue.environment,
) => {
  let internallambdaValue = InternalExpressionValue.lambdaValueToInternal(lambdaValue)
  let internalArgArray = argArray->Js.Array2.map(InternalExpressionValue.toInternal)
  Lambda.foreignFunctionInterface(
    internallambdaValue,
    internalArgArray,
    environment,
    Expression.reduceExpression,
  )->Belt.Result.map(InternalExpressionValue.toExternal)
}

let defaultEnvironment = ExternalExpressionValue.defaultEnvironment

let defaultExternalBindings = ReducerInterface_StdLib.externalStdLib
