module Expression = Reducer.Expression
module ExpressionValue = ReducerInterface.ExpressionValue

open Jest
open Expect

let expectParseToBe = (expr: string, answer: string) =>
  Reducer.parse(expr)->Expression.toStringResult->expect->toBe(answer)

let expectEvalToBe = (expr: string, answer: string) =>
  Reducer.eval(expr)->ExpressionValue.toStringResult->expect->toBe(answer)

// Current configuration does not ignore this file so we have to have a test
test("test helpers", () => expect(1)->toBe(1))
