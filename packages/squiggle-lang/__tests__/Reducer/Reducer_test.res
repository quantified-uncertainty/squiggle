open Jest
open Reducer_TestHelpers

describe("eval", () => {
  // All MathJs operators and functions are builtin for string, float and boolean
  // .e.g + - / * > >= < <= == /= not and or
  // See https://mathjs.org/docs/reference/functions.html
  describe("expressions", () => {
    testEvalToBe("1", "Ok(1)")
    testEvalToBe("1+2", "Ok(3)")
    testEvalToBe("(1+2)*3", "Ok(9)")
    testEvalToBe("2>1", "Ok(true)")
    testEvalToBe("concat('a ', 'b')", "Ok('a b')")
    testEvalToBe("log(10)", "Ok(2.302585092994046)")
    testEvalToBe("cos(10)", "Ok(-0.8390715290764524)")
    // TODO more built ins
  })
  describe("arrays", () => {
    test("empty array", () => expectEvalToBe("[]", "Ok([])"))
    testEvalToBe("[1, 2, 3]", "Ok([1,2,3])")
    testEvalToBe("['hello', 'world']", "Ok(['hello','world'])")
    testEvalToBe("([0,1,2])[1]", "Ok(1)")
    testDescriptionEvalToBe("index not found", "([0,1,2])[10]", "Error(Array index not found: 10)")
  })
  describe("records", () => {
    test("define", () => expectEvalToBe("{a: 1, b: 2}", "Ok({a: 1,b: 2})"))
    test("index", () => expectEvalToBe("r = {a: 1}; r.a", "Ok(1)"))
    test("index", () => expectEvalToBe("r = {a: 1}; r.b", "Error(Record property not found: b)"))
    testEvalError("{a: 1}.b")  // invalid syntax
  })

  describe("multi-line", () => {
    testEvalError("1; 2")
    testEvalError("1+1; 2+1")
  })
  describe("assignment", () => {
    testEvalToBe("x=1; x", "Ok(1)")
    testEvalToBe("x=1+1; x+1", "Ok(3)")
    testEvalToBe("x=1; y=x+1; y+1", "Ok(3)")
    testEvalError("1; x=1")
    testEvalError("1; 1")
    testEvalToBe("x=1; x=1", "Ok({x: 1})")
  })
})

describe("test exceptions", () => {
  testDescriptionEvalToBe(
    "javascript exception",
    "javascriptraise('div by 0')",
    "Error(JS Exception: Error: 'div by 0')",
  )
  // testDescriptionEvalToBe(
  //   "rescript exception",
  //   "rescriptraise()",
  //   "Error(TODO: unhandled rescript exception)",
  // )
})
