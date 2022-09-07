module Bindings = Reducer_Bindings
module BindingsReplacer = Reducer_Expression_BindingsReplacer
module ErrorValue = Reducer_ErrorValue
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface_InternalExpressionValue
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module ProjectReducerFnT = ReducerProject_ReducerFn_T
module Result = Belt.Result

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
      raise(ErrorValue.ErrorException(ErrorValue.REArityError(None, parametersLength, argsLength)))
    } else {
      args
    }
  }
  let exprOrFFI = castInternalCodeToExpression(lambdaValue.body)
  switch exprOrFFI {
  | NotFFI(_) => reallyCheck
  | FFI(_) => args
  }
}

let checkIfReduced = (args: list<internalExpressionValue>) =>
  args->Belt.List.reduceReverse(list{}, (acc, arg) =>
      switch arg {
      | IEvSymbol(symbol) => raise(ErrorValue.ErrorException(ErrorValue.RESymbolNotFound(symbol)))
      | _ => list{arg, ...acc}
      }
  )

let caseNotFFI = (
  lambdaValue: ExpressionValue.lambdaValue,
  expr,
  args,
  accessors: ProjectAccessorsT.t,
  reducer: ProjectReducerFnT.t,
) => {
  let parameterList = lambdaValue.parameters->Belt.List.fromArray
  let zippedParameterList = parameterList->Belt.List.zip(args)
  let bindings = Belt.List.reduce(zippedParameterList, lambdaValue.context, (
    acc,
    (variable, variableValue),
  ) => acc->Bindings.set(variable, variableValue))
  let newExpression = ExpressionBuilder.eBlock(list{expr})
  reducer(newExpression, bindings, accessors)
}

let caseFFI = (ffiFn: ExpressionT.ffiFn, args, accessors: ProjectAccessorsT.t) => {
  switch ffiFn(args->Belt.List.toArray, accessors.environment) {
    | Ok(value) => value
    | Error(value) => raise(ErrorValue.ErrorException(value))
  }
}

let applyParametersToLambda = (
  lambdaValue: ExpressionValue.lambdaValue,
  args,
  accessors: ProjectAccessorsT.t,
  reducer: ProjectReducerFnT.t,
): internalExpressionValue => {
  let args = checkArity(lambdaValue, args)->checkIfReduced
  let exprOrFFI = castInternalCodeToExpression(lambdaValue.body)
  switch exprOrFFI {
  | NotFFI(expr) => caseNotFFI(lambdaValue, expr, args, accessors, reducer)
  | FFI(ffiFn) => caseFFI(ffiFn, args, accessors)
  }
}

let doLambdaCall = (
  lambdaValue: ExpressionValue.lambdaValue,
  args,
  accessors: ProjectAccessorsT.t,
  reducer: ProjectReducerFnT.t,
) => applyParametersToLambda(lambdaValue, args, accessors, reducer)

let foreignFunctionInterface = (
  lambdaValue: ExpressionValue.lambdaValue,
  argArray: array<internalExpressionValue>,
  accessors: ProjectAccessorsT.t,
  reducer: ProjectReducerFnT.t,
): internalExpressionValue => {
  let args = argArray->Belt.List.fromArray
  applyParametersToLambda(lambdaValue, args, accessors, reducer)
}
