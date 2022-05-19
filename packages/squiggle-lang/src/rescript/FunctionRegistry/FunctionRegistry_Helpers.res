open FunctionRegistry_Core

let impossibleError = "Wrong inputs / Logically impossible"

module Wrappers = {
  let symbolic = r => DistributionTypes.Symbolic(r)
  let evDistribution = r => ReducerInterface_ExpressionValue.EvDistribution(r)
  let symbolicEvDistribution = r => r->Symbolic->evDistribution
}

module Prepare = {
  let recordWithTwoArgsToValues = (inputs: array<value>): result<array<value>, string> =>
    switch inputs {
    | [Record([(_, n1), (_, n2)])] => Ok([n1, n2])
    | _ => Error(impossibleError)
    }

  let twoNumberInputs = (inputs: array<value>): result<(float, float), string> => {
    switch inputs {
    | [Number(n1), Number(n2)] => Ok(n1, n2)
    | _ => Error(impossibleError)
    }
  }

  let twoDistOrNumber = (values: array<value>): result<(distOrNumber, distOrNumber), string> => {
    switch values {
    | [DistOrNumber(a1), DistOrNumber(a2)] => Ok(a1, a2)
    | _ => Error(impossibleError)
    }
  }

  let twoDistOrNumberFromRecord = (values: array<value>) =>
    values->recordWithTwoArgsToValues->E.R.bind(twoDistOrNumber)
}

module Process = {
  let twoDistsOrNumbersToDist = (
    ~fn: ((float, float)) => result<DistributionTypes.genericDist, string>,
    ~values: (distOrNumber, distOrNumber),
  ) => {
    let toSampleSet = r => GenericDist.toSampleSetDist(r, 1000)
    let sampleSetToExpressionValue = (
      b: Belt.Result.t<QuriSquiggleLang.SampleSetDist.t, QuriSquiggleLang.DistributionTypes.error>,
    ) =>
      switch b {
      | Ok(r) => Ok(ReducerInterface_ExpressionValue.EvDistribution(SampleSet(r)))
      | Error(d) => Error(DistributionTypes.Error.toString(d))
      }

    let mapFnResult = r =>
      switch r {
      | Ok(r) => Ok(GenericDist.sample(r))
      | Error(r) => Error(Operation.Other(r))
      }

    let singleVarSample = (a, fn) => {
      let sampleSetResult =
        toSampleSet(a) |> E.R2.bind(dist =>
          SampleSetDist.samplesMap(
            ~fn=f => fn(f)->mapFnResult,
            dist,
          )->E.R2.errMap(r => DistributionTypes.SampleSetError(r))
        )
      sampleSetResult->sampleSetToExpressionValue
    }

    switch values {
    | (Number(a1), Number(a2)) => fn((a1, a2))->E.R2.fmap(Wrappers.evDistribution)
    | (Dist(a1), Number(a2)) => singleVarSample(a1, r => fn((r, a2)))
    | (Number(a1), Dist(a2)) => singleVarSample(a2, r => fn((a1, r)))
    | (Dist(a1), Dist(a2)) => {
        let altFn = (a, b) => fn((a, b))->mapFnResult
        let sampleSetResult =
          E.R.merge(toSampleSet(a1), toSampleSet(a2))
          ->E.R2.errMap(DistributionTypes.Error.toString)
          ->E.R.bind(((t1, t2)) => {
            SampleSetDist.map2(~fn=altFn, ~t1, ~t2)->E.R2.errMap(Operation.Error.toString)
          })
          ->E.R2.errMap(r => DistributionTypes.OtherError(r))
        sampleSetResult->sampleSetToExpressionValue
      }
    }
  }

  let twoDistsOrNumbersToDistUsingSymbolicDist = (
    ~fn: ((float, float)) => result<SymbolicDistTypes.symbolicDist, string>,
    ~values,
  ) => {
    twoDistsOrNumbersToDist(~fn=r => r->fn->E.R2.fmap(Wrappers.symbolic), ~values)
  }
}