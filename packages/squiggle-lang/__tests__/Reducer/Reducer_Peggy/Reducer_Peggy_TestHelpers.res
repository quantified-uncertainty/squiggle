module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.InternalExpressionValue
module Parse = Reducer_Peggy_Parse
module Result = Belt.Result
module ToExpression = Reducer_Peggy_ToExpression
module Bindings = Reducer_Bindings

open Jest
open Expect

let expectParseToBe = (expr, answer) =>
  Parse.parse(expr)->Parse.toStringResult->expect->toBe(answer)

let testParse = (expr, answer) => test(expr, () => expectParseToBe(expr, answer))

let expectToExpressionToBe = (expr, answer, ~v="_", ()) => {
  let rExpr = Parse.parse(expr)->Result.map(ToExpression.fromNode)
  let a1 = rExpr->ExpressionT.toStringResultOkless

  if v == "_" {
    a1->expect->toBe(answer)
  } else {
    let a2 =
      rExpr
      ->Result.flatMap(expr => Expression.BackCompatible.evaluate(expr))
      ->Reducer_Helpers.rRemoveDefaultsInternal
      ->ExpressionValue.toStringResultOkless
    (a1, a2)->expect->toEqual((answer, v))
  }
}

let testToExpression = (expr, answer, ~v="_", ()) =>
  test(expr, () => expectToExpressionToBe(expr, answer, ~v, ()))

module MyOnly = {
  let testParse = (expr, answer) => Only.test(expr, () => expectParseToBe(expr, answer))
  let testToExpression = (expr, answer, ~v="_", ()) =>
    Only.test(expr, () => expectToExpressionToBe(expr, answer, ~v, ()))
}

module MySkip = {
  let testParse = (expr, answer) => Skip.test(expr, () => expectParseToBe(expr, answer))
  let testToExpression = (expr, answer, ~v="_", ()) =>
    Skip.test(expr, () => expectToExpressionToBe(expr, answer, ~v, ()))
}
