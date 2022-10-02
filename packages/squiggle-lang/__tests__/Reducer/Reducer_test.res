open Jest
open Reducer_TestHelpers

describe("eval", () => {
  describe("expressions", () => {
    testEvalToBe("1", "Ok(1)")
    testEvalToBe("-1", "Ok(-1)")
    testEvalToBe("1-1", "Ok(0)")
    testEvalToBe("1+2", "Ok(3)")
    testEvalToBe("(1+2)*3", "Ok(9)")
    testEvalToBe("2>1", "Ok(true)")
    testEvalToBe("concat('a ', 'b')", "Ok('a b')")
    testEvalToBe("concat([3,4], [5,6,7])", "Ok([3,4,5,6,7])")
    testEvalToBe("log(10)", "Ok(2.302585092994046)")
    testEvalToBe("Math.cos(10)", "Ok(-0.8390715290764524)")
    // TODO more built ins
  })

  describe("missing function", () => {
    testEvalToBe("testZadanga(1)", "Error(testZadanga is not defined)")

    testEvalToBe(
      "arr = [normal(3,2)]; map(arr, zarathsuzaWasHere)",
      "Error(zarathsuzaWasHere is not defined)",
    )
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
    testEvalError("{a: 1}.b") // invalid syntax
    test("always the same property ending", () =>
      expectEvalToBe(
        `{
      a: 1, 
      b: 2,
    }`,
        "Ok({a: 1,b: 2})",
      )
    )
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
    testEvalToBe("x=1; x=1; x", "Ok(1)")
  })

  describe("blocks", () => {
    testEvalToBe("x = { y = { z = 5; z * 2 }; y + 3 }; x", "Ok(13)")
  })
})

describe("test exceptions", () => {
  testDescriptionEvalToBe(
    "javascript exception",
    "javascriptraise('div by 0')",
    "Error(Error: 'div by 0')",
  )
  // testDescriptionEvalToBe(
  //   "rescript exception",
  //   "rescriptraise()",
  //   "Error(TODO: unhandled rescript exception)",
  // )
})
