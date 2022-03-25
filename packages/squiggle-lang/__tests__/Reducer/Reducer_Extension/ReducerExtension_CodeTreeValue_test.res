module CTV = Reducer.Extension.CodeTreeValue
open Jest
open Expect

describe("CodeTreeValue", () => {
  test("showArgs", () =>
    expect([CTV.CtvNumber(1.), CTV.CtvString("a")]->CTV.showArgs)
    ->toBe("1, 'a'")
  )

  test("showFunctionCall", () =>
    expect( ("fn", [CTV.CtvNumber(1.), CTV.CtvString("a")])->CTV.showFunctionCall )
    ->toBe("fn(1, 'a')")
  )
})
