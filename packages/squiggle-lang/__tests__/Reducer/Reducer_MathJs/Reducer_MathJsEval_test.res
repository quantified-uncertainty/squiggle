module MathJs = Reducer_MathJs
module ErrorValue = Reducer.ErrorValue

open Jest
open ExpectJs

describe("eval", () => {
  test("Number", () => expect(MathJs.Eval.eval("1"))->toEqual(Ok(IEvNumber(1.))))
  test("Number expr", () => expect(MathJs.Eval.eval("1-1"))->toEqual(Ok(IEvNumber(0.))))
  test("String", () => expect(MathJs.Eval.eval("'hello'"))->toEqual(Ok(IEvString("hello"))))
  test("String expr", () =>
    expect(MathJs.Eval.eval("concat('hello ','world')"))->toEqual(Ok(IEvString("hello world")))
  )
  test("Boolean", () => expect(MathJs.Eval.eval("true"))->toEqual(Ok(IEvBool(true))))
  test("Boolean expr", () => expect(MathJs.Eval.eval("2>1"))->toEqual(Ok(IEvBool(true))))
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
