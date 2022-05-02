module Bindings = Reducer_Expression_Bindings
module ErrorValue = Reducer_ErrorValue
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module Result = Belt.Result

type environment = ReducerInterface_ExpressionValue.environment
type expression = ExpressionT.expression
type expressionValue = ReducerInterface_ExpressionValue.expressionValue
type externalBindings = ReducerInterface_ExpressionValue.externalBindings
type internalCode = ReducerInterface_ExpressionValue.internalCode

external castInternalCodeToExpression: internalCode => expression = "%identity"

let checkArity = (lambdaValue: ExpressionValue.lambdaValue, args: list<expressionValue>) => {
  let argsLength = Belt.List.length(args)
  let parametersLength = Js.Array2.length(lambdaValue.parameters)
  if argsLength !== parametersLength {
    ErrorValue.REArityError(None, parametersLength, argsLength)->Error
  } else {
    args->Ok
  }
}

let checkIfReduced = (args: list<expressionValue>) =>
  args->Belt.List.reduceReverse(Ok(list{}), (rAcc, arg) =>
    rAcc->Result.flatMap(acc =>
      switch arg {
      | EvSymbol(symbol) => ErrorValue.RESymbolNotFound(symbol)->Error
      | _ => list{arg, ...acc}->Ok
      }
    )
  )

let applyParametersToLambda = (
  lambdaValue: ExpressionValue.lambdaValue,
  args,
  environment,
  reducer: ExpressionT.reducerFn,
): result<expressionValue, 'e> => {
  checkArity(lambdaValue, args)->Result.flatMap(args =>
    checkIfReduced(args)->Result.flatMap(args => {
      let expr = castInternalCodeToExpression(lambdaValue.body)
      let parameterList = lambdaValue.parameters->Belt.List.fromArray
      let zippedParameterList = parameterList->Belt.List.zip(args)
      let bindings = Belt.List.reduce(
        zippedParameterList,
        lambdaValue.context->Bindings.fromExternalBindings,
        (acc, (variable, variableValue)) => acc->Belt.Map.String.set(variable, variableValue),
      )
      let newExpression = ExpressionBuilder.eBlock(list{expr})
      reducer(newExpression, bindings, environment)
    })
  )
}

let doLambdaCall = (lambdaValue: ExpressionValue.lambdaValue, args, environment, reducer) => {
  applyParametersToLambda(lambdaValue, args, environment, reducer)
}
