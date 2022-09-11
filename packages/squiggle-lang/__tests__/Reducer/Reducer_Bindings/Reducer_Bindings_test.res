@@warning("-44")
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Bindings = Reducer_Bindings

open Jest
open Expect
open Expect.Operators

describe("Name Space", () => {
  let value = Reducer_T.IEvNumber(1967.0)
  let nameSpace = Bindings.makeEmptyBindings()->Bindings.set("value", value)
  test("get", () => {
    expect(Bindings.get(nameSpace, "value")) == Some(value)
  })

  test("chain and get", () => {
    let mainNameSpace = Bindings.makeEmptyBindings()->Bindings.chainTo([nameSpace])
    expect(Bindings.get(mainNameSpace, "value")) == Some(value)
  })

  test("chain and set", () => {
    let mainNameSpace0 = Bindings.makeEmptyBindings()->Bindings.chainTo([nameSpace])
    let mainNameSpace =
      mainNameSpace0->Bindings.set("value", Reducer_T.IEvNumber(1968.0))
    expect(Bindings.get(mainNameSpace, "value")) == Some(Reducer_T.IEvNumber(1968.0))
  })
})
