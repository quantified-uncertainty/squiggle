module ExpressionValue = ReducerInterface.ExpressionValue

open Jest
open Expect

let expectEvalToBe = (expr: string, answer: string) =>
  Reducer.evaluate(expr)->ExpressionValue.toStringResult->expect->toBe(answer)

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
  testEval(
    "addOne(t)=t+1; toInternalSampleArray(mapSamples(fromSamples([1,2,3,4,5,6]), addOne))",
    "Ok([2,3,4,5,6,7])",
  )
})

describe("builtin exception", () => {
  //It's a pity that MathJs does not return error position
  test("MathJs Exception", () =>
    expectEvalToBe("testZadanga()", "Error(JS Exception: Error: Undefined function testZadanga)")
  )
})
