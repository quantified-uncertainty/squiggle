module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface_ExpressionValue
module Parse = Reducer_Peggy_Parse
module Result = Belt.Result
module ToExpression = Reducer_Peggy_ToExpression

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
      ->Result.flatMap(expr =>
        Expression.reduceExpression(
          expr,
          ReducerInterface_DefaultExternalBindings.defaultInternalBindings,
          ExpressionValue.defaultEnvironment,
        )
      )
      ->Reducer_Helpers.rRemoveDefaults
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
