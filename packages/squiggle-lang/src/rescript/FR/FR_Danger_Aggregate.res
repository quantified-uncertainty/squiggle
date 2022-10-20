open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Danger_Aggregate"
let requiresNamespace = true

module AggregateFs = {
  module Helpers = {
    let checker = (fn, xs, minLength) => {
      switch E.A.length(xs) < minLength {
      | true =>
        Error(
          "Aggregation method does not make sense with fewer than" ++
          Belt.Int.toString(minLength) ++ " elements",
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
    let probabilityToOdds = p => p /. (1.0 -. p)
    let oddsToProbability = o => o /. (1.0 +. o)
    let sum = xs => E.A.reduce(xs, 0.0, (a, b) => a +. b)
    let mean = xs => sum(xs) /. Belt.Float.fromInt(E.A.length(xs))

    let geomMean = (xs: array<float>) => {
      let xsLogs = E.A.fmap(x => Js.Math.log2(x), xs)
      let meanXsLogs = mean(xsLogs)
      let answer = Js.Math.pow_float(~base=2.0, ~exp=meanXsLogs)
      answer
    }
    let arithmeticMean = (xs: array<float>) => {
      let sumXs = E.A.reduce(xs, 0.0, (a, b) => a +. b)
      let meanXs = sumXs /. Belt.Float.fromInt(E.A.length(xs))
      meanXs
    }

    let geomMeanOfOdds = xs => {
      let arrayOfOdds = E.A.fmap(p => probabilityToOdds(p), xs)
      let arrayOfLogsOfOdds = E.A.fmap(p => Js.Math.log2(p), arrayOfOdds)
      let meanOfLogsOfodds = mean(arrayOfLogsOfOdds)
      let geomMeanOfOdds = Js.Math.pow_float(~base=2.0, ~exp=meanOfLogsOfodds)
      let result = oddsToProbability(geomMeanOfOdds)
      result
    }

    let extremizedGeometricMeanOfOdds = (~xs, ~extremizationParameter=1.5, ()) => {
      let arrayOfOdds = E.A.fmap(p => probabilityToOdds(p), xs)
      let arrayOfLogsOfOdds = E.A.fmap(p => Js.Math.log2(p), arrayOfOdds)
      let extremizedSumOfLogsOfOdds = extremizationParameter *. mean(arrayOfLogsOfOdds)
      let extremizedGeomMeanOfOdds = Js.Math.pow_float(~base=2.0, ~exp=extremizedSumOfLogsOfOdds)
      let result = oddsToProbability(extremizedGeomMeanOfOdds)
      result
    }

    let neyman = xs => {
      let n = Belt.Int.toFloat(E.A.length(xs))
      let d =
        n *.
        (Js.Math.sqrt(3.0 *. Js.Math.pow_float(~base=n, ~exp=2.0) -. 3.0 *. n +. 1.0) -. 2.0) /.
        (Js.Math.pow_float(~base=n, ~exp=2.0) -. n -. 1.0)
      let result = extremizedGeometricMeanOfOdds(~xs, ~extremizationParameter=d, ())
      result
    }

    let samotsvety = xs => {
      let sortedXs = Belt.SortArray.stableSortBy(xs, (a, b) => a > b ? 1 : -1)
      let middleXs = Belt.Array.slice(sortedXs, ~offset=1, ~len=E.A.length(xs) - 2)
      Js.log2("MiddleXs: ", middleXs)
      let answer = geomMeanOfOdds(middleXs)
      answer
    }
  }
  module Lib = {
    let geomMean = Function.make(
      ~name="geomMean",
      ~nameSpace,
      ~output=EvtNumber,
      ~requiresNamespace=true,
      ~examples=[`Danger_Aggregate.geomMean([0.1, 0.2, 0.4])`],
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
      ~examples=[`Danger_Aggregate.arithmeticMean([0.1, 0.2, 0.4])`],
      ~definitions=[
        DefineFn.Numbers.arrayToNum("arithmeticMean", xs =>
          Helpers.checker(xs => Ok(Helpers.arithmeticMean(xs)), xs, 2)
        ),
      ],
      (),
    )
    let geomMeanOfOdds = Function.make(
      ~name="geomMeanOfOdds",
      ~nameSpace,
      ~output=EvtNumber,
      ~requiresNamespace=true,
      ~examples=[`Danger_Aggregate.geomMeanOfOdds([0.1, 0.2, 0.4])`],
      ~definitions=[
        DefineFn.Numbers.arrayToNum("geomMeanOfOdds", xs =>
          Helpers.checker(xs => Ok(Helpers.geomMeanOfOdds(xs)), xs, 2)
        ),
      ],
      (),
    )

    let neyman = Function.make(
      ~name="neyman",
      ~nameSpace,
      ~output=EvtNumber,
      ~requiresNamespace=true,
      ~examples=[`Danger_Aggregate.neyman([0.1, 0.2, 0.4])`],
      ~definitions=[
        DefineFn.Numbers.arrayToNum("neyman", xs =>
          Helpers.checker(xs => Ok(Helpers.neyman(xs)), xs, 2)
        ),
      ],
      (),
    )

    let samotsvety = Function.make(
      ~name="samotsvety",
      ~nameSpace,
      ~output=EvtNumber,
      ~requiresNamespace=true,
      ~examples=[`Danger_Aggregate.samotsvety([0.1, 0.2, 0.4])`],
      ~definitions=[
        DefineFn.Numbers.arrayToNum("samotsvety", xs =>
          Helpers.checker(xs => Ok(Helpers.samotsvety(xs)), xs, 3)
        ),
      ],
      (),
    )
  }
}

let library = [
  // Combinatorics
  AggregateFs.Lib.geomMean,
  AggregateFs.Lib.arithmeticMean,
  AggregateFs.Lib.geomMeanOfOdds,
  AggregateFs.Lib.neyman,
  AggregateFs.Lib.samotsvety,
]

/* To do
- [ ] Add remaining aggregation types
- [ ] Add documentation
*/
