open Jest
open Expect

module Macro = Reducer_Expression_Macro
module Bindings = Reducer_Expression_Bindings
module Expression = Reducer_Expression
module ExpressionValue = ReducerInterface_ExpressionValue
module T = Reducer_Expression_T

let testMacro_ = (
  tester,
  bindArray: array<(string, ExpressionValue.expressionValue)>,
  expr: T.expression,
  expectedCode: string,
) => {
  let bindings = Belt.Map.String.fromArray(bindArray)
  tester(expr->T.toString, () =>
    expr
    ->Macro.expandMacroCall(
      bindings,
      ExpressionValue.defaultEnvironment,
      Expression.reduceExpression,
    )
    ->T.toStringResult
    ->expect
    ->toEqual(expectedCode)
  )
}

let testMacroEval_ = (
  tester,
  bindArray: array<(string, ExpressionValue.expressionValue)>,
  expr: T.expression,
  expectedValue: string,
) => {
  let bindings = Belt.Map.String.fromArray(bindArray)
  tester(expr->T.toString, () =>
    expr
    ->Macro.doMacroCall(bindings, ExpressionValue.defaultEnvironment, Expression.reduceExpression)
    ->ExpressionValue.toStringResult
    ->expect
    ->toEqual(expectedValue)
  )
}

let testMacro = (
  bindArray: array<(string, ExpressionValue.expressionValue)>,
  expr: T.expression,
  expectedExpr: string,
) => testMacro_(test, bindArray, expr, expectedExpr)
let testMacroEval = (
  bindArray: array<(string, ExpressionValue.expressionValue)>,
  expr: T.expression,
  expectedValue: string,
) => testMacroEval_(test, bindArray, expr, expectedValue)

module MySkip = {
  let testMacro = (
    bindArray: array<(string, ExpressionValue.expressionValue)>,
    expr: T.expression,
    expectedExpr: string,
  ) => testMacro_(Skip.test, bindArray, expr, expectedExpr)
  let testMacroEval = (
    bindArray: array<(string, ExpressionValue.expressionValue)>,
    expr: T.expression,
    expectedValue: string,
  ) => testMacroEval_(Skip.test, bindArray, expr, expectedValue)
}

module MyOnly = {
  let testMacro = (
    bindArray: array<(string, ExpressionValue.expressionValue)>,
    expr: T.expression,
    expectedExpr: string,
  ) => testMacro_(Only.test, bindArray, expr, expectedExpr)
  let testMacroEval = (
    bindArray: array<(string, ExpressionValue.expressionValue)>,
    expr: T.expression,
    expectedValue: string,
  ) => testMacroEval_(Only.test, bindArray, expr, expectedValue)
}
