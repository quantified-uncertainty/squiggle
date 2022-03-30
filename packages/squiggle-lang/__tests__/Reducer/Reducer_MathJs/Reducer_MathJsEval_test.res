open ReducerInterface.ExpressionValue
module MathJs = Reducer.MathJs
module ErrorValue = Reducer.ErrorValue

open Jest
open ExpectJs

describe("eval", () => {
  test("Number", () => expect(MathJs.Eval.eval("1"))->toEqual(Ok(EvNumber(1.))))
  test("Number expr", () => expect(MathJs.Eval.eval("1-1"))->toEqual(Ok(EvNumber(0.))))
  test("String", () => expect(MathJs.Eval.eval("'hello'"))->toEqual(Ok(EvString("hello"))))
  test("String expr", () =>
    expect(MathJs.Eval.eval("concat('hello ','world')"))->toEqual(Ok(EvString("hello world")))
  )
  test("Boolean", () => expect(MathJs.Eval.eval("true"))->toEqual(Ok(EvBool(true))))
  test("Boolean expr", () => expect(MathJs.Eval.eval("2>1"))->toEqual(Ok(EvBool(true))))
})

describe("errors", () => {
  // All those errors propagete up and are returned by the resolver
  test("unknown function", () =>
    expect(MathJs.Eval.eval("testZadanga()"))->toEqual(
      Error(ErrorValue.REJs(Some("Undefined function testZadanga"), Some("Error"))),
    )
  )

  test("unknown answer type", () =>
    expect(MathJs.Eval.eval("1+1i"))->toEqual(
      Error(ErrorValue.RETodo("Unhandled MathJs literal type: object")),
    )
  )
})
