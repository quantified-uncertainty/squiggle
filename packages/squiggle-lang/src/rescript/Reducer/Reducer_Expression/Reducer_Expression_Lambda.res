module BindingsReplacer = Reducer_Expression_BindingsReplacer
module ErrorValue = Reducer_ErrorValue
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface_InternalExpressionValue
module Bindings = Reducer_Bindings
module Result = Belt.Result

type environment = ReducerInterface_InternalExpressionValue.environment
type expression = ExpressionT.expression
type expressionOrFFI = ExpressionT.expressionOrFFI
type internalExpressionValue = ReducerInterface_InternalExpressionValue.t
type internalCode = ReducerInterface_InternalExpressionValue.internalCode

external castInternalCodeToExpression: internalCode => expressionOrFFI = "%identity"

let checkArity = (
  lambdaValue: ExpressionValue.lambdaValue,
  args: list<internalExpressionValue>,
) => {
  let reallyCheck = {
    let argsLength = Belt.List.length(args)
    let parametersLength = Js.Array2.length(lambdaValue.parameters)
    if argsLength !== parametersLength {
      ErrorValue.REArityError(None, parametersLength, argsLength)->Error
    } else {
      args->Ok
    }
  }
  let exprOrFFI = castInternalCodeToExpression(lambdaValue.body)
  switch exprOrFFI {
  | NotFFI(_) => reallyCheck
  | FFI(_) => args->Ok
  }
}

let checkIfReduced = (args: list<internalExpressionValue>) =>
  args->Belt.List.reduceReverse(Ok(list{}), (rAcc, arg) =>
    rAcc->Result.flatMap(acc =>
      switch arg {
      | IEvSymbol(symbol) => ErrorValue.RESymbolNotFound(symbol)->Error
      | _ => list{arg, ...acc}->Ok
      }
    )
  )

let caseNotFFI = (lambdaValue: ExpressionValue.lambdaValue, expr, args, environment, reducer) => {
  let parameterList = lambdaValue.parameters->Belt.List.fromArray
  let zippedParameterList = parameterList->Belt.List.zip(args)
  let bindings = Belt.List.reduce(zippedParameterList, lambdaValue.context, (
    acc,
    (variable, variableValue),
  ) => acc->Bindings.set(variable, variableValue))
  let newExpression = ExpressionBuilder.eBlock(list{expr})
  reducer(newExpression, bindings, environment)
}

let caseFFI = (ffiFn: ExpressionT.ffiFn, args, environment) => {
  ffiFn(args->Belt.List.toArray, environment)
}

let applyParametersToLambda = (
  lambdaValue: ExpressionValue.lambdaValue,
  args,
  environment,
  reducer: ExpressionT.reducerFn,
): result<internalExpressionValue, 'e> => {
  checkArity(lambdaValue, args)->Result.flatMap(args =>
    checkIfReduced(args)->Result.flatMap(args => {
      let exprOrFFI = castInternalCodeToExpression(lambdaValue.body)
      switch exprOrFFI {
      | NotFFI(expr) => caseNotFFI(lambdaValue, expr, args, environment, reducer)
      | FFI(ffiFn) => caseFFI(ffiFn, args, environment)
      }
    })
  )
}

let doLambdaCall = (lambdaValue: ExpressionValue.lambdaValue, args, environment, reducer) =>
  applyParametersToLambda(lambdaValue, args, environment, reducer)

let foreignFunctionInterface = (
  lambdaValue: ExpressionValue.lambdaValue,
  argArray: array<internalExpressionValue>,
  environment: ExpressionValue.environment,
  reducer: ExpressionT.reducerFn,
): result<internalExpressionValue, 'e> => {
  let args = argArray->Belt.List.fromArray
  applyParametersToLambda(lambdaValue, args, environment, reducer)
}
