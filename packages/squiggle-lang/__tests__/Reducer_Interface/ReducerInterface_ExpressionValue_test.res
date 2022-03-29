open ReducerInterface.ExpressionValue
open Jest
open Expect

describe("ExpressionValue", () => {
  test("showArgs", () => expect([EvNumber(1.), EvString("a")]->showArgs)->toBe("1, 'a'"))

  test("showFunctionCall", () =>
    expect(("fn", [EvNumber(1.), EvString("a")])->showFunctionCall)->toBe("fn(1, 'a')")
  )
})
