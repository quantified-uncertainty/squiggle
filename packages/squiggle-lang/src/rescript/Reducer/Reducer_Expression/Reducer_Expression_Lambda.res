module Bindings = Reducer_Expression_Bindings
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue

type environment = ReducerInterface_ExpressionValue.environment
type expression = ExpressionT.expression
type expressionValue = ReducerInterface_ExpressionValue.expressionValue
type externalBindings = ReducerInterface_ExpressionValue.externalBindings
type internalCode = ReducerInterface_ExpressionValue.internalCode

external castInternalCodeToExpression: internalCode => expression = "%identity"

let applyParametersToLambda = (
  internal: internalCode,
  parameters: array<string>,
  args: list<expressionValue>,
  context: externalBindings,
  environment,
  reducer: ExpressionT.reducerFn,
): result<expressionValue, 'e> => {
  let expr = castInternalCodeToExpression(internal)
  let parameterList = parameters->Belt.List.fromArray
  let zippedParameterList = parameterList->Belt.List.zip(args)
  let bindings = Belt.List.reduce(zippedParameterList, context->Bindings.fromExternalBindings, (
    acc,
    (variable, variableValue),
  ) => acc->Belt.Map.String.set(variable, variableValue))
  let newExpression = ExpressionBuilder.eBlock(list{expr})
  reducer(newExpression, bindings, environment)
}

let doLambdaCall = (lambdaValue: ExpressionValue.lambdaValue, args, environment, reducer) => {
  applyParametersToLambda(lambdaValue.body, lambdaValue.parameters, args, lambdaValue.context, environment, reducer)
}
