module Expression = Reducer.Expression
module ExpressionValue = ReducerInterface.ExpressionValue

open Jest
open Expect

let expectParseToBe = (expr: string, answer: string) =>
  Reducer.parse(expr)->Expression.toStringResult->expect->toBe(answer)

let expectParsePartialToBe = (expr: string, answer: string) =>
  Reducer.parse(expr)->Expression.toStringResult->expect->toBe(answer)

let expectEvalToBe = (expr: string, answer: string) =>
  Reducer.evaluate(expr)->ExpressionValue.toStringResult->expect->toBe(answer)

let expectEvalBindingsToBe = (expr: string, bindings: Reducer.externalBindings, answer: string) =>
  Reducer.evaluateWBindings(expr, bindings)->ExpressionValue.toStringResult->expect->toBe(answer)

let testParseToBe = (expr, answer) => test(expr, () => expectParseToBe(expr, answer))

let testDescriptionParseToBe = (desc, expr, answer) =>
  test(desc, () => expectParseToBe(expr, answer))

let testEvalToBe = (expr, answer) => test(expr, () => expectEvalToBe(expr, answer))

let testDescriptionEvalToBe = (desc, expr, answer) => test(desc, () => expectEvalToBe(expr, answer))

let testEvalBindingsToBe = (expr, bindingsList, answer) =>
  test(expr, () => expectEvalBindingsToBe(expr, bindingsList->Js.Dict.fromList, answer))

module MySkip = {
  let testEvalBindingsToBe = (expr, bindingsList, answer) =>
    Skip.test(expr, () => expectEvalBindingsToBe(expr, bindingsList->Js.Dict.fromList, answer))
  let testEvalToBe = (expr, answer) => Skip.test(expr, () => expectEvalToBe(expr, answer))
}
module MyOnly = {
  let testEvalBindingsToBe = (expr, bindingsList, answer) =>
    Only.test(expr, () => expectEvalBindingsToBe(expr, bindingsList->Js.Dict.fromList, answer))
  let testEvalToBe = (expr, answer) => Only.test(expr, () => expectEvalToBe(expr, answer))
}
