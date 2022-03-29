open ReducerInterface.ExpressionValue
module ME = Reducer.MathJs.Eval
module ErrorValue = Reducer.Error

open Jest
open ExpectJs

describe("eval", () => {
  test("Number", () => expect(ME.eval("1"))->toEqual(Ok(EvNumber(1.))))
  test("Number expr", () => expect(ME.eval("1-1"))->toEqual(Ok(EvNumber(0.))))
  test("String", () => expect(ME.eval("'hello'"))->toEqual(Ok(EvString("hello"))))
  test("String expr", () =>
    expect(ME.eval("concat('hello ','world')"))->toEqual(Ok(EvString("hello world")))
  )
  test("Boolean", () => expect(ME.eval("true"))->toEqual(Ok(EvBool(true))))
  test("Boolean expr", () => expect(ME.eval("2>1"))->toEqual(Ok(EvBool(true))))
})

describe("errors", () => {
  // All those errors propagete up and are returned by the resolver
  test("unknown function", () =>
    expect(ME.eval("testZadanga()"))->toEqual(
      Error(ErrorValue.REJs(Some("Undefined function testZadanga"), Some("Error"))),
    )
  )

  test("unknown answer type", () =>
    expect(ME.eval("1+1i"))->toEqual(
      Error(ErrorValue.RETodo("Unhandled MathJs literal type: object")),
    )
  )
})
