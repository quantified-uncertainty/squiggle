@@warning("-44")
module Bindings = Reducer_Bindings
module Namespace = Reducer_Namespace

open Jest
open Expect
open Expect.Operators

describe("Bindings", () => {
  let value = Reducer_T.IEvNumber(1967.0)
  let bindings = Bindings.make()->Bindings.set("value", value)
  test("get", () => {
    expect(bindings->Bindings.get("value")) == Some(value)
  })

  test("get nonexisting value", () => {
    expect(bindings->Bindings.get("nosuchvalue")) == None
  })

  test("get on extended", () => {
    expect(bindings->Bindings.extend->Bindings.get("value")) == Some(value)
  })

  test("locals", () => {
    expect(bindings->Bindings.locals->Namespace.get("value")) == Some(value)
  })

  test("locals on extendeed", () => {
    expect(bindings->Bindings.extend->Bindings.locals->Namespace.get("value")) == None
  })

  describe("extend", () => {
    let value2 = Reducer_T.IEvNumber(5.)
    let extendedBindings = bindings->Bindings.extend->Bindings.set("value", value2)

    test(
      "get on extended",
      () => {
        expect(extendedBindings->Bindings.get("value")) == Some(value2)
      },
    )

    test(
      "get on original",
      () => {
        expect(bindings->Bindings.get("value")) == Some(value)
      },
    )
  })
})
