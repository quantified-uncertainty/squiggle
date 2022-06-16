module MathJs = Reducer_MathJs
module ErrorValue = Reducer.ErrorValue

open Jest
open ExpectJs

describe("eval", () => {
  test("Number", () => expect(MathJs.Eval.eval("1"))->toEqual(Ok(IevNumber(1.))))
  test("Number expr", () => expect(MathJs.Eval.eval("1-1"))->toEqual(Ok(IevNumber(0.))))
  test("String", () => expect(MathJs.Eval.eval("'hello'"))->toEqual(Ok(IevString("hello"))))
  test("String expr", () =>
    expect(MathJs.Eval.eval("concat('hello ','world')"))->toEqual(Ok(IevString("hello world")))
  )
  test("Boolean", () => expect(MathJs.Eval.eval("true"))->toEqual(Ok(IevBool(true))))
  test("Boolean expr", () => expect(MathJs.Eval.eval("2>1"))->toEqual(Ok(IevBool(true))))
})

describe("errors", () => {
  // All those errors propagete up and are returned by the resolver
  test("unknown function", () =>
    expect(MathJs.Eval.eval("testZadanga()"))->toEqual(
      Error(ErrorValue.REJavaScriptExn(Some("Undefined function testZadanga"), Some("Error"))),
    )
  )

  test("unknown answer type", () =>
    expect(MathJs.Eval.eval("1+1i"))->toEqual(
      Error(ErrorValue.RETodo("Unhandled MathJs literal type: object")),
    )
  )
})
