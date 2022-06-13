module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module ErrorValue = Reducer_ErrorValue
module Bindings = Reducer_Category_Bindings

open Jest
open Expect

let unwrapRecord = rValue =>
  rValue->Belt.Result.flatMap(value =>
    switch value {
    | ExpressionValue.EvRecord(aRecord) => Ok(aRecord)
    | _ => ErrorValue.RETodo("TODO: External bindings must be returned")->Error
    }
  )

let expectParseToBe = (expr: string, answer: string) =>
  Reducer.parse(expr)->ExpressionT.toStringResult->expect->toBe(answer)

let expectEvalToBe = (expr: string, answer: string) =>
  Reducer.evaluate(expr)
  ->Reducer_Helpers.rRemoveDefaults
  ->ExpressionValue.toStringResult
  ->expect
  ->toBe(answer)

let expectEvalError = (expr: string) =>
  Reducer.evaluate(expr)->ExpressionValue.toStringResult->expect->toMatch("Error\(")

let expectEvalBindingsToBe = (expr: string, bindings: Reducer.externalBindings, answer: string) =>
  Reducer.evaluateUsingOptions(expr, ~externalBindings=Some(bindings), ~environment=None)
  ->Reducer_Helpers.rRemoveDefaults
  ->ExpressionValue.toStringResult
  ->expect
  ->toBe(answer)

let testParseToBe = (expr, answer) => test(expr, () => expectParseToBe(expr, answer))
let testDescriptionParseToBe = (desc, expr, answer) =>
  test(desc, () => expectParseToBe(expr, answer))

let testEvalError = expr => test(expr, () => expectEvalError(expr))
let testEvalToBe = (expr, answer) => test(expr, () => expectEvalToBe(expr, answer))
let testDescriptionEvalToBe = (desc, expr, answer) => test(desc, () => expectEvalToBe(expr, answer))
let testEvalBindingsToBe = (expr, bindingsList, answer) =>
  test(expr, () => expectEvalBindingsToBe(expr, bindingsList->Js.Dict.fromList, answer))

module MySkip = {
  let testParseToBe = (expr, answer) => Skip.test(expr, () => expectParseToBe(expr, answer))
  let testEvalToBe = (expr, answer) => Skip.test(expr, () => expectEvalToBe(expr, answer))
  let testEvalBindingsToBe = (expr, bindingsList, answer) =>
    Skip.test(expr, () => expectEvalBindingsToBe(expr, bindingsList->Js.Dict.fromList, answer))
}
module MyOnly = {
  let testParseToBe = (expr, answer) => Only.test(expr, () => expectParseToBe(expr, answer))
  let testEvalToBe = (expr, answer) => Only.test(expr, () => expectEvalToBe(expr, answer))
  let testEvalBindingsToBe = (expr, bindingsList, answer) =>
    Only.test(expr, () => expectEvalBindingsToBe(expr, bindingsList->Js.Dict.fromList, answer))
}
