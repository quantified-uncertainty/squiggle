open ReducerInterface.InternalExpressionValue
open Jest
open Expect

describe("ExpressionValue", () => {
  test("argsToString", () => expect([IEvNumber(1.), IEvString("a")]->argsToString)->toBe("1,'a'"))

  test("toStringFunctionCall", () =>
    expect(("fn", [IEvNumber(1.), IEvString("a")])->toStringFunctionCall)->toBe("fn(1,'a')")
  )
})
