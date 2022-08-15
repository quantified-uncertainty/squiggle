open Jest
open Expect

module BindingsReplacer = Reducer_Expression_BindingsReplacer
module Expression = Reducer_Expression
// module ExpressionValue = ReducerInterface.ExpressionValue
module InternalExpressionValue = ReducerInterface.InternalExpressionValue
module ExpressionWithContext = Reducer_ExpressionWithContext
module Macro = Reducer_Expression_Macro
module T = Reducer_Expression_T
module Bindings = Reducer_Bindings

let testMacro_ = (
  tester,
  bindArray: array<(string, InternalExpressionValue.t)>,
  expr: T.expression,
  expectedCode: string,
) => {
  let bindings = Bindings.fromArray(bindArray)
  tester(expr->T.toString, () =>
    expr
    ->Macro.expandMacroCall(
      bindings,
      InternalExpressionValue.defaultEnvironment,
      Expression.reduceExpression,
    )
    ->ExpressionWithContext.toStringResult
    ->expect
    ->toEqual(expectedCode)
  )
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
      InternalExpressionValue.defaultEnvironment,
      Expression.reduceExpression,
    )
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
