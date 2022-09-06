@@warning("-44")
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Bindings = Reducer_Bindings

open Jest
open Expect
open Expect.Operators

describe("Name Space", () => {
  let value = InternalExpressionValue.IEvNumber(1967.0)
  let nameSpace = Bindings.emptyNameSpace->Bindings.set("value", value)
  test("get", () => {
    expect(Bindings.get(nameSpace, "value")) == Some(value)
  })

  test("chain and get", () => {
    let mainNameSpace = Bindings.emptyNameSpace->Bindings.chainTo([nameSpace])
    expect(Bindings.get(mainNameSpace, "value")) == Some(value)
  })

  test("chain and set", () => {
    let mainNameSpace0 = Bindings.emptyNameSpace->Bindings.chainTo([nameSpace])
    let mainNameSpace =
      mainNameSpace0->Bindings.set("value", InternalExpressionValue.IEvNumber(1968.0))
    expect(Bindings.get(mainNameSpace, "value")) == Some(InternalExpressionValue.IEvNumber(1968.0))
  })
})
