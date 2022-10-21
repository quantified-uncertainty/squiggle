module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T
module Parse = Reducer_Peggy_Parse
module Result = Belt.Result
module ToExpression = Reducer_Peggy_ToExpression
module Bindings = Reducer_Bindings

open Jest
open Expect

let expectParseToBe = (expr, answer) =>
  Parse.parse(expr, "test")->Parse.toStringResult->expect->toBe(answer)

let testParse = (expr, answer) => test(expr, () => expectParseToBe(expr, answer))

let expectExpressionToBe = (expr, answer, ~v="_", ()) => {
  let rExpr = Parse.parse(expr, "test")->Result.map(ToExpression.fromNode)
  let a1 = rExpr->ExpressionT.toStringResultOkless

  if v == "_" {
    a1->expect->toBe(answer)
  } else {
    let a2 =
      rExpr
      ->E.R.errMap(e => e->SqError.fromParseError)
      ->Result.flatMap(expr => Expression.BackCompatible.evaluate(expr))
      ->Reducer_Value.toStringResultOkless
    (a1, a2)->expect->toEqual((answer, v))
  }
}

let testToExpression = (expr, answer, ~v="_", ()) =>
  test(expr, () => expectExpressionToBe(expr, answer, ~v, ()))

module MyOnly = {
  let testParse = (expr, answer) => Only.test(expr, () => expectParseToBe(expr, answer))
  let testToExpression = (expr, answer, ~v="_", ()) =>
    Only.test(expr, () => expectExpressionToBe(expr, answer, ~v, ()))
}

module MySkip = {
  let testParse = (expr, answer) => Skip.test(expr, () => expectParseToBe(expr, answer))
  let testToExpression = (expr, answer, ~v="_", ()) =>
    Skip.test(expr, () => expectExpressionToBe(expr, answer, ~v, ()))
}
