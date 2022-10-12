@@warning("-44")
module Namespace = Reducer_Namespace

open Jest
open Expect
open Expect.Operators

let makeValue = (v: float) => v->Reducer_T.IEvNumber

describe("Namespace", () => {
  let value = makeValue(5.)
  let v2 = makeValue(2.)
  let ns = Namespace.make()->Namespace.set("value", value)

  test("get", () => {
    expect(ns->Namespace.get("value")) == Some(value)
  })

  test("get nonexisting value", () => {
    expect(ns->Namespace.get("nosuchvalue")) == None
  })

  test("set", () => {
    let ns2 = ns->Namespace.set("v2", v2)
    expect(ns2->Namespace.get("v2")) == Some(v2)
  })

  test("immutable", () => {
    let _ = ns->Namespace.set("v2", Reducer_T.IEvNumber(2.))
    expect(ns->Namespace.get("v2")) == None
  })

  describe("merge many", () => {
    let x1 = makeValue(10.)
    let x2 = makeValue(20.)
    let x3 = makeValue(30.)
    let x4 = makeValue(40.)
    let ns1 = Namespace.make()->Namespace.set("x1", x1)->Namespace.set("x2", x2)
    let ns2 = Namespace.make()->Namespace.set("x3", x3)->Namespace.set("x4", x4)

    let nsMerged = Namespace.mergeMany([ns, ns1, ns2])

    test(
      "merge many 1",
      () => {
        expect(nsMerged->Namespace.get("x1")) == Some(x1)
      },
    )
    test(
      "merge many 2",
      () => {
        expect(nsMerged->Namespace.get("x4")) == Some(x4)
      },
    )
    test(
      "merge many 3",
      () => {
        expect(nsMerged->Namespace.get("value")) == Some(value)
      },
    )
  })
})
