module Parse = Reducer.MathJs.Parse
module Result = Belt.Result

open Jest
open Expect

let expectParseToBe = (expr, answer) =>
  Parse.parse(expr)->Result.flatMap(Parse.castNodeType)->Parse.toStringResult->expect->toBe(answer)

let testParse = (expr, answer) => test(expr, () => expectParseToBe(expr, answer))

let testDescParse = (desc, expr, answer) => test(desc, () => expectParseToBe(expr, answer))

module MySkip = {
  let testParse = (expr, answer) => Skip.test(expr, () => expectParseToBe(expr, answer))

  let testDescParse = (desc, expr, answer) => Skip.test(desc, () => expectParseToBe(expr, answer))
}

describe("MathJs parse", () => {
  describe("literals operators paranthesis", () => {
    testParse("1", "1")
    testParse("'hello'", "'hello'")
    testParse("true", "true")
    testParse("1+2", "add(1, 2)")
    testParse("add(1,2)", "add(1, 2)")
    testParse("(1)", "(1)")
    testParse("(1+2)", "(add(1, 2))")
  })

  describe("multi-line", () => {
    testParse("1; 2", "{1; 2}")
  })

  describe("variables", () => {
    testParse("x = 1", "x = 1")
    testParse("x", "x")
    testParse("x = 1; x", "{x = 1; x}")
  })

  describe("functions", () => {
    MySkip.testParse("identity(x) = x", "???")
    MySkip.testParse("identity(x)", "???")
  })

  describe("arrays", () => {
    testDescParse("empty", "[]", "[]")
    testDescParse("define", "[0, 1, 2]", "[0, 1, 2]")
    testDescParse("define with strings", "['hello', 'world']", "['hello', 'world']")
    MySkip.testParse("range(0, 4)", "range(0, 4)")
    testDescParse("index", "([0,1,2])[1]", "([0, 1, 2])[1]")
  })

  describe("records", () => {
    testDescParse("define", "{a: 1, b: 2}", "{a: 1, b: 2}")
    testDescParse("use", "record.property", "record['property']")
  })

  describe("comments", () => {
    MySkip.testDescParse("define", "# This is a comment", "???")
  })

  describe("if statement", () => { // TODO Tertiary operator instead
    MySkip.testDescParse("define", "if (true) { 1 } else { 0 }", "???")
  })
})
