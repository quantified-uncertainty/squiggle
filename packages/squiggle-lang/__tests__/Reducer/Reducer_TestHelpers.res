module Expression = Reducer.Expression
module ExpressionValue = ReducerInterface.ExpressionValue

open Jest
open Expect

let expectParseToBe = (expr: string, answer: string) =>
  Reducer.parse(expr)->Expression.toStringResult->expect->toBe(answer)

let expectEvalToBe = (expr: string, answer: string) =>
  Reducer.evaluate(expr)->ExpressionValue.toStringResult->expect->toBe(answer)

let expectEvalBindingsToBe = (expr: string, bindings: Reducer.externalBindings, answer: string) =>
  Reducer.evaluateWBindings(expr, bindings)->ExpressionValue.toStringResult->expect->toBe(answer)
