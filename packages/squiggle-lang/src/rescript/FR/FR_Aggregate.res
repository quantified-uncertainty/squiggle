open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Aggregate"
let requiresNamespace = true

module AggregateFs = {
  module Helpers = {
    let checker = (fn, xs, minLength) => {
      switch E.A.length(xs) < minLength {
      | true =>
        Error(
          "Aggregation method does not make sense with fewer than" ++
          Belt.Int.toString(minLength) ++ "elements",
        )
      | false => {
          let checkedIndividualXs = E.A.fmap(x =>
            switch (x, x > 1.0, x < 0.0) {
            | (0.0, _, _) => Error("0 is not a probability")
            | (1.0, _, _) => Error("1 is not a probability")
            | (_, true, _) => Error("Probabilities can't be higher than 1")
            | (_, _, true) => Error("Probabilities can't be lower than 0")
            | (_, false, false) => Ok(x)
            }
          , xs)
          let checkedCollectiveXs = E.A.R.firstErrorOrOpen(checkedIndividualXs)
          let result = switch checkedCollectiveXs {
          | Ok(xs) => fn(xs)
          | Error(e) => Error(e)
          }
          result
        }
      }
    }
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
      ~examples=[`Aggregate.geomMean([0.1, 0.2, 0.4])`],
      ~definitions=[
        DefineFn.Numbers.arrayToNum("geomMean", xs =>
          Helpers.checker(xs => Ok(Helpers.geomMean(xs)), xs, 2)
        ),
      ],
      (),
    )
    let arithmeticMean = Function.make(
      ~name="arithmeticMean",
      ~nameSpace,
      ~output=EvtNumber,
      ~requiresNamespace=true,
      ~examples=[`Aggregate.arithmeticMean([0.1, 0.2, 0.4])`],
      ~definitions=[
        DefineFn.Numbers.arrayToNum("geomMean", xs =>
          Helpers.checker(xs => Ok(Helpers.arithmeticMean(xs)), xs, 2)
        ),
      ],
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
