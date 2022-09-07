open Jest
open Expect

module Bindings = Reducer_Bindings
module BindingsReplacer = Reducer_Expression_BindingsReplacer
module Expression = Reducer_Expression
module ExpressionWithContext = Reducer_ExpressionWithContext
module InternalExpressionValue = ReducerInterface.InternalExpressionValue
module Macro = Reducer_Expression_Macro
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module T = Reducer_Expression_T

let testMacro_ = (
  tester,
  bindArray: array<(string, InternalExpressionValue.t)>,
  expr: T.expression,
  expectedCode: string,
) => {
  let bindings = Bindings.fromArray(bindArray)
  tester(expr->T.toString, () => {
    let result = switch expr
    ->Reducer_Dispatch_BuiltInMacros.dispatchMacroCall(
      bindings,
      ProjectAccessorsT.identityAccessors,
      Expression.reduceExpressionInProject,
    ) {
      | v => Ok(v)
      | exception Reducer_ErrorValue.ErrorException(e) => Error(e)
    }

    result
    ->ExpressionWithContext.toStringResult
    ->expect
    ->toEqual(expectedCode)
  })
}

let testMacroEval_ = (
  tester,
  bindArray: array<(string, InternalExpressionValue.t)>,
  expr: T.expression,
  expectedValue: string,
) => {
  let bindings = Bindings.fromArray(bindArray)
  tester(expr->T.toString, () =>
    expr
    ->Macro.doMacroCall(
      bindings,
      ProjectAccessorsT.identityAccessors,
      Expression.reduceExpressionInProject,
    )
    ->Ok
    ->InternalExpressionValue.toStringResult
    ->expect
    ->toEqual(expectedValue)
  )
}

let testMacro = (
  bindArray: array<(string, InternalExpressionValue.t)>,
  expr: T.expression,
  expectedExpr: string,
) => testMacro_(test, bindArray, expr, expectedExpr)
let testMacroEval = (
  bindArray: array<(string, InternalExpressionValue.t)>,
  expr: T.expression,
  expectedValue: string,
) => testMacroEval_(test, bindArray, expr, expectedValue)

module MySkip = {
  let testMacro = (
    bindArray: array<(string, InternalExpressionValue.t)>,
    expr: T.expression,
    expectedExpr: string,
  ) => testMacro_(Skip.test, bindArray, expr, expectedExpr)
  let testMacroEval = (
    bindArray: array<(string, InternalExpressionValue.t)>,
    expr: T.expression,
    expectedValue: string,
  ) => testMacroEval_(Skip.test, bindArray, expr, expectedValue)
}

module MyOnly = {
  let testMacro = (
    bindArray: array<(string, InternalExpressionValue.t)>,
    expr: T.expression,
    expectedExpr: string,
  ) => testMacro_(Only.test, bindArray, expr, expectedExpr)
  let testMacroEval = (
    bindArray: array<(string, InternalExpressionValue.t)>,
    expr: T.expression,
    expectedValue: string,
  ) => testMacroEval_(Only.test, bindArray, expr, expectedValue)
}
