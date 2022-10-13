module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T

open Jest
open Expect

let unwrapRecord = rValue =>
  rValue->Belt.Result.flatMap(value =>
    switch value {
    | Reducer_T.IEvRecord(aRecord) => Ok(aRecord)
    | _ => SqError.Message.RETodo("TODO: Internal bindings must be returned")->Error
    }
  )

let expectParseToBe = (code: string, answer: string) =>
  Expression.BackCompatible.parse(code)->ExpressionT.toStringResult->expect->toBe(answer)

let expectEvalToBe = (code: string, answer: string) =>
  Expression.BackCompatible.evaluateString(code)->Reducer_Value.toStringResult->expect->toBe(answer)

let expectEvalError = (code: string) =>
  Expression.BackCompatible.evaluateString(code)
  ->Reducer_Value.toStringResult
  ->expect
  ->toMatch("Error\\(")

let testParseToBe = (expr, answer) => test(expr, () => expectParseToBe(expr, answer))
let testDescriptionParseToBe = (desc, expr, answer) =>
  test(desc, () => expectParseToBe(expr, answer))

let testEvalError = expr => test(expr, () => expectEvalError(expr))
let testEvalToBe = (expr, answer) => test(expr, () => expectEvalToBe(expr, answer))
let testDescriptionEvalToBe = (desc, expr, answer) => test(desc, () => expectEvalToBe(expr, answer))

module MySkip = {
  let testParseToBe = (expr, answer) => Skip.test(expr, () => expectParseToBe(expr, answer))
  let testEvalToBe = (expr, answer) => Skip.test(expr, () => expectEvalToBe(expr, answer))
}
module MyOnly = {
  let testParseToBe = (expr, answer) => Only.test(expr, () => expectParseToBe(expr, answer))
  let testEvalToBe = (expr, answer) => Only.test(expr, () => expectEvalToBe(expr, answer))
}
