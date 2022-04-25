module Parse = Reducer.MathJs.Parse
module Result = Belt.Result

open Jest
open Expect

let expectParseToBe = (expr, answer) =>
  Parse.parse(expr)->Result.flatMap(Parse.castNodeType)->Parse.toStringResult->expect->toBe(answer)

let testParse = (expr, answer) => test(expr, () => expectParseToBe(expr, answer))

let testDescriptionParse = (desc, expr, answer) => test(desc, () => expectParseToBe(expr, answer))

module MySkip = {
  let testParse = (expr, answer) => Skip.test(expr, () => expectParseToBe(expr, answer))

  let testDescriptionParse = (desc, expr, answer) =>
    Skip.test(desc, () => expectParseToBe(expr, answer))
}

module MyOnly = {
  let testParse = (expr, answer) => Only.test(expr, () => expectParseToBe(expr, answer))
  let testDescriptionParse = (desc, expr, answer) =>
    Only.test(desc, () => expectParseToBe(expr, answer))
}

describe("MathJs parse", () => {
  describe("literals operators parenthesis", () => {
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
    testParse("identity(x) = x", "identity = (x) => x")
    testParse("identity(x)", "identity(x)")
  })

  describe("arrays", () => {
    testDescriptionParse("empty", "[]", "[]")
    testDescriptionParse("define", "[0, 1, 2]", "[0, 1, 2]")
    testDescriptionParse("define with strings", "['hello', 'world']", "['hello', 'world']")
    testParse("range(0, 4)", "range(0, 4)")
    testDescriptionParse("index", "([0,1,2])[1]", "([0, 1, 2])[1]")
  })

  describe("records", () => {
    testDescriptionParse("define", "{a: 1, b: 2}", "{a: 1, b: 2}")
    testDescriptionParse("use", "record.property", "record['property']")
  })

  describe("comments", () => {
    testDescriptionParse("define", "1 # This is a comment", "1")
  })
})
