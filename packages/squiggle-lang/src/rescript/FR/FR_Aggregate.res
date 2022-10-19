open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Aggregate"
let requiresNamespace = true

module AggregateFs = {
  module Helpers = {
    let geomMean = (xs: array<float>) => {
      let xsLogs = E.A.fmap(x => Js.Math.log2(x), xs)
      let sumXsLogs = E.A.reduce(xsLogs, 0.0, (a, b) => a +. b)
      let meanXsLogs = sumXsLogs /. Belt.Float.fromInt(E.A.length(xs))
      let answer = Js.Math.pow_float(~base=2.0, ~exp=meanXsLogs)
      answer
    }
    let arithmeticMean = (xs: array<float>) => {
      let sumXs = E.A.reduce(xs, 0.0, (a, b) => a +. b)
      let meanXs = sumXs /. Belt.Float.fromInt(E.A.length(xs))
      meanXs
    }
  }
  module Lib = {
    let geomMean = Function.make(
      ~name="geomMean",
      ~nameSpace,
      ~output=EvtNumber,
      ~requiresNamespace=true,
      ~examples=[`Aggregate.geomMean([1, 2, 4])`],
      ~definitions=[DefineFn.Numbers.arrayToNum("geomMean", xs => Ok(Helpers.geomMean(xs)))],
      (),
    )
  }
}

let library = [
  // Combinatorics
  AggregateFs.Lib.geomMean,
]

// Then, to actually use,
// add the new functions to
// src/rescript/FunctionRegistry/FunctionRegistry_Library.res
