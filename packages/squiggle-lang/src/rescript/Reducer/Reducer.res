module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module ExpressionValue = ReducerInterface_ExpressionValue
module Lambda = Reducer_Expression_Lambda

type environment = ReducerInterface_ExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue
type expressionValue = ReducerInterface_ExpressionValue.expressionValue
type externalBindings = ReducerInterface_ExpressionValue.externalBindings
type lambdaValue = ExpressionValue.lambdaValue

let evaluate = Expression.evaluate
let evaluateUsingOptions = Expression.evaluateUsingOptions
let evaluatePartialUsingExternalBindings = Expression.evaluatePartialUsingExternalBindings
let parse = Expression.parse

let foreignFunctionInterface = (
  lambdaValue: lambdaValue,
  argArray: array<expressionValue>,
  environment: ExpressionValue.environment,
) => {
  Lambda.foreignFunctionInterface(lambdaValue, argArray, environment, Expression.reduceExpression)
}

let defaultEnvironment = ExpressionValue.defaultEnvironment

let defaultExternalBindings = ReducerInterface_StdLib.externalStdLib
