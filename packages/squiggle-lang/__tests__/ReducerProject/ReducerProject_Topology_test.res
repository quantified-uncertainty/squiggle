@@warning("-44")
module Topology = ReducerProject_Topology

open Jest
open Expect
open Expect.Operators

describe("Topology", () => {
  test("when equal 1x", () => {
    Topology.runOrderDiff(["a"], ["a"])->expect == []
  })

  test("when equal 3x", () => {
    Topology.runOrderDiff(["a", "b", "c"], ["a", "b", "c"])->expect == []
  })

  test("less dependents", () => {
    Topology.runOrderDiff(["a", "b"], ["a", "b", "c", "d"])->expect == []
  })

  test("more dependents", () => {
    Topology.runOrderDiff(["a", "b", "c", "d"], ["a", "b"])->expect == ["c", "d"]
  })
})
