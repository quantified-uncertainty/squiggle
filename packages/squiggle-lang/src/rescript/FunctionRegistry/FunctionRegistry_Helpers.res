open FunctionRegistry_Core

let impossibleError = "Wrong inputs / Logically impossible"

module Wrappers = {
  let symbolic = r => DistributionTypes.Symbolic(r)
  let evDistribution = r => ReducerInterface_ExpressionValue.EvDistribution(r)
  let symbolicEvDistribution = r => r->Symbolic->evDistribution
}

module Prepare = {
  type ts = array<frValue>
  type err = string

  module ToValueArray = {
    module Record = {
      let twoArgs = (inputs: ts): result<ts, err> =>
        switch inputs {
        | [FRValueRecord([(_, n1), (_, n2)])] => Ok([n1, n2])
        | _ => Error(impossibleError)
        }
    }
  }

  module ToValueTuple = {
    let twoDistOrNumber = (values: ts): result<(frValueDistOrNumber, frValueDistOrNumber), err> => {
      switch values {
      | [FRValueDistOrNumber(a1), FRValueDistOrNumber(a2)] => Ok(a1, a2)
      | _ => Error(impossibleError)
      }
    }

    module Record = {
      let twoDistOrNumber = (values: ts): result<(frValueDistOrNumber, frValueDistOrNumber), err> =>
        values->ToValueArray.Record.twoArgs->E.R.bind(twoDistOrNumber)
    }
  }
}

module Process = {
  let twoDistsOrNumbersToDist = (
    ~fn: ((float, float)) => result<DistributionTypes.genericDist, string>,
    ~values: (frValueDistOrNumber, frValueDistOrNumber),
  ): result<DistributionTypes.genericDist, string> => {
    let toSampleSet = r => GenericDist.toSampleSetDist(r, 1000)
    let sampleSetToExpressionValue = (b: Belt.Result.t<SampleSetDist.t, DistributionTypes.error>) =>
      switch b {
      | Ok(r) => Ok(DistributionTypes.SampleSet(r))
      | Error(d) => Error(DistributionTypes.Error.toString(d))
      }

    let mapFnResult = r =>
      switch r {
      | Ok(r) => Ok(GenericDist.sample(r))
      | Error(r) => Error(Operation.Other(r))
      }

    let singleVarSample = (dist, fn) => {
      let sampleSetResult =
        dist
        ->toSampleSet
        ->E.R.bind(dist =>
          SampleSetDist.samplesMap(
            ~fn=f => fn(f)->mapFnResult,
            dist,
          )->E.R2.errMap(r => DistributionTypes.SampleSetError(r))
        )
      sampleSetResult->sampleSetToExpressionValue
    }

    switch values {
    | (FRValueNumber(a1), FRValueNumber(a2)) => fn((a1, a2))
    | (FRValueDist(a1), FRValueNumber(a2)) => singleVarSample(a1, r => fn((r, a2)))
    | (FRValueNumber(a1), FRValueDist(a2)) => singleVarSample(a2, r => fn((a1, r)))
    | (FRValueDist(a1), FRValueDist(a2)) => {
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
    let newFn = r => fn(r)->E.R2.fmap(Wrappers.symbolic)
    twoDistsOrNumbersToDist(~fn=newFn, ~values)
  }
}

module TwoArgDist = {
  let process = (~fn, r) =>
    r
    ->E.R.bind(Process.twoDistsOrNumbersToDistUsingSymbolicDist(~fn, ~values=_))
    ->E.R2.fmap(Wrappers.evDistribution)

  let mkRegular = (name, fn) => {
    FnDefinition.make(~name, ~inputs=[FRTypeDistOrNumber, FRTypeDistOrNumber], ~run=inputs =>
      inputs->Prepare.ToValueTuple.twoDistOrNumber->process(~fn)
    )
  }

  let mkDef90th = (name, fn) => {
    FnDefinition.make(
      ~name,
      ~inputs=[FRTypeRecord([("p5", FRTypeDistOrNumber), ("p95", FRTypeDistOrNumber)])],
      ~run=inputs => inputs->Prepare.ToValueTuple.Record.twoDistOrNumber->process(~fn),
    )
  }

  let mkDefMeanStdev = (name, fn) => {
    FnDefinition.make(
      ~name,
      ~inputs=[FRTypeRecord([("mean", FRTypeDistOrNumber), ("stdev", FRTypeDistOrNumber)])],
      ~run=inputs => inputs->Prepare.ToValueTuple.Record.twoDistOrNumber->process(~fn),
    )
  }
}
