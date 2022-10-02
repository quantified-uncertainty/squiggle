open Jest
open Expect

describe("ExpressionValue", () => {
  test("argsToString", () =>
    expect([IEvNumber(1.), IEvString("a")]->Reducer_Value.argsToString)->toBe("1,'a'")
  )

  test("toStringFunctionCall", () =>
    expect(("fn", [IEvNumber(1.), IEvString("a")])->Reducer_Value.toStringFunctionCall)->toBe(
      "fn(1,'a')",
    )
  )
})
