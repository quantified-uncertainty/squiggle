open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Danger_Aggregate"
let requiresNamespace = true
type check = {
  f: float => bool,
  errorString: string,
}

module AggregateFs = {
  module Helpers = {
    let applyIfCheck = (fn, xs, check) => {
      switch check(xs) {
      | Error(msg) => Error(msg)
      | Ok(_) => Ok(fn(xs))
      }
    }
    let applyIfMinLengthAndCheck = (fn, xs, minLength, check) => {
      switch E.A.length(xs) >= minLength {
      | true => applyIfCheck(fn, xs, check)
      | false =>
        Error(
          "Length of array is " ++
          E.I.toString(E.A.length(xs)) ++
          ", but it should be at least " ++
          E.I.toString(minLength) ++ " for this aggregation method.",
        )
      }
    }
    let checkWellFormedProbabilities = xs => {
      let applyCheck = (check: check) => {
        let result = E.A.findIndex(check.f, xs)
        switch result {
        | None => Ok(true)
        | Some(x) => Error(check.errorString ++ ", at index " ++ E.I.toString(x))
        }
      }
      let notZeroCheck = {
        f: x => x != 0.0,
        errorString: "0 is not a probability",
      }
      let higherThanZeroCheck = {
        f: x => x > 0.0,
        errorString: "Probabilities can't be lower than 0",
      }
      let lowerThanOneCheck = {
        f: x => x < 1.0,
        errorString: "Probabilities can't be higher than 1",
      }
      let notOneCheck = {
        f: x => x != 1.0,
        errorString: "1 is not a probability",
      }
      let checks = [notZeroCheck, higherThanZeroCheck, lowerThanOneCheck, notOneCheck]
      let results = E.A.fmap(applyCheck, checks)
      let result = E.A.R.firstErrorOrOpen(results)
      result
    }

    let probabilityToOdds = p => p /. (1.0 -. p)
    let oddsToProbability = o => o /. (1.0 +. o)

    let geomMean = E.A.Floats.geomean
    let arithmeticMean = E.A.Floats.mean

    let geomMeanOfOdds = xs => {
      let arrayOfOdds = E.A.fmap(p => probabilityToOdds(p), xs)
      let geomMeanOfOdds = geomMean(arrayOfOdds)
      let result = oddsToProbability(geomMeanOfOdds)
      result
    }

    let extremizedGeometricMeanOfOdds = (~xs, ~extremizationParameter=1.5, ()) => {
      let arrayOfOdds = E.A.fmap(p => probabilityToOdds(p), xs)
      let arrayOfLogsOfOdds = E.A.fmap(p => Js.Math.log2(p), arrayOfOdds)
      let extremizedSumOfLogsOfOdds = extremizationParameter *. arithmeticMean(arrayOfLogsOfOdds)
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
      let sortedXs = E.A.Floats.sort(xs) 
      let middleXs = Belt.Array.slice(sortedXs, ~offset=1, ~len=E.A.length(xs) - 2)
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
          Helpers.applyIfMinLengthAndCheck(
            Helpers.geomMean,
            xs,
            2,
            Helpers.checkWellFormedProbabilities,
          )
        ),
        //xs => Ok(Helpers.geomMean(xs)), xs, 2)
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
          Helpers.applyIfMinLengthAndCheck(
            Helpers.arithmeticMean,
            xs,
            2,
            Helpers.checkWellFormedProbabilities,
          )
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
          Helpers.applyIfMinLengthAndCheck(
            Helpers.geomMeanOfOdds,
            xs,
            2,
            Helpers.checkWellFormedProbabilities,
          )
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
          Helpers.applyIfMinLengthAndCheck(
            Helpers.neyman,
            xs,
            2,
            Helpers.checkWellFormedProbabilities,
          )
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
          Helpers.applyIfMinLengthAndCheck(
            Helpers.samotsvety,
            xs,
            3,
            Helpers.checkWellFormedProbabilities,
          )
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
