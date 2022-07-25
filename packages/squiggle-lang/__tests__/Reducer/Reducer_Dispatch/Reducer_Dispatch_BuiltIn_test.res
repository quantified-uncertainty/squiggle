module ExpressionValue = ReducerInterface.InternalExpressionValue
module Expression = Reducer_Expression

open Jest
open Expect

let expectEvalToBe = (sourceCode: string, answer: string) =>
  Expression.BackCompatible.evaluateString(sourceCode)
  ->ExpressionValue.toStringResult
  ->expect
  ->toBe(answer)

let testEval = (expr, answer) => test(expr, () => expectEvalToBe(expr, answer))

describe("builtin", () => {
  // All MathJs operators and functions are available for string, number and boolean
  // .e.g + - / * > >= < <= == /= not and or
  // See https://mathjs.org/docs/expressions/syntax.html
  // See https://mathjs.org/docs/reference/functions.html
  testEval("-1", "Ok(-1)")
  testEval("1-1", "Ok(0)")
  testEval("2>1", "Ok(true)")
  testEval("concat('a','b')", "Ok('ab')")
})

describe("builtin exception", () => {
  //It's a pity that MathJs does not return error position
  test("MathJs Exception", () =>
    expectEvalToBe("testZadanga(1)", "Error(JS Exception: Error: Undefined function testZadanga)")
  )
})

describe("error reporting from collection functions", () => {
  testEval("arr=[1,2,3]; map(arr, {|x| x*2})", "Ok([2,4,6])")
  testEval(
    "arr = [normal(3,2)]; map(arr, zarathsuzaWasHere)",
    "Error(zarathsuzaWasHere is not defined)",
  )
  // FIXME: returns "Error(Function not found: map(Array,Symbol))"
  // Actually this error is correct but not informative
})
