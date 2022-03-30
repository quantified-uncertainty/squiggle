open ReducerInterface.ExpressionValue
open Jest
open Expect

describe("ExpressionValue", () => {
  test("argsToString", () => expect([EvNumber(1.), EvString("a")]->argsToString)->toBe("1, 'a'"))

  test("toStringFunctionCall", () =>
    expect(("fn", [EvNumber(1.), EvString("a")])->toStringFunctionCall)->toBe("fn(1, 'a')")
  )
})
