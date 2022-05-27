open FunctionRegistry_Core

let impossibleError = "Wrong inputs / Logically impossible"

module Wrappers = {
  let symbolic = r => DistributionTypes.Symbolic(r)
  let evDistribution = r => ReducerInterface_ExpressionValue.EvDistribution(r)
  let symbolicEvDistribution = r => r->DistributionTypes.Symbolic->evDistribution
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

    let oneDistOrNumber = (values: ts): result<frValueDistOrNumber, err> => {
      switch values {
      | [FRValueDistOrNumber(a1)] => Ok(a1)
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
  module DistOrNumberToDist = {
    module Helpers = {
      let toSampleSet = (r, env: DistributionOperation.env) =>
        GenericDist.toSampleSetDist(r, env.sampleCount)

      let mapFnResult = r =>
        switch r {
        | Ok(r) => Ok(GenericDist.sample(r))
        | Error(r) => Error(Operation.Other(r))
        }

      let wrapSymbolic = (fn, r) => r->fn->E.R2.fmap(Wrappers.symbolic)

      let singleVarSample = (dist, fn, env) => {
        switch toSampleSet(dist, env) {
        | Ok(dist) =>
          switch SampleSetDist.samplesMap(~fn=f => fn(f)->mapFnResult, dist) {
          | Ok(r) => Ok(DistributionTypes.SampleSet(r))
          | Error(r) => Error(DistributionTypes.Error.toString(DistributionTypes.SampleSetError(r)))
          }
        | Error(r) => Error(DistributionTypes.Error.toString(r))
        }
      }

      let twoVarSample = (dist1, dist2, fn, env) => {
        let altFn = (a, b) => fn((a, b))->mapFnResult
        switch E.R.merge(toSampleSet(dist1, env), toSampleSet(dist2, env)) {
        | Ok((t1, t2)) =>
          switch SampleSetDist.map2(~fn=altFn, ~t1, ~t2) {
          | Ok(r) => Ok(DistributionTypes.SampleSet(r))
          | Error(r) => Error(SampleSetDist.Error.toString(r))
          }
        | Error(r) => Error(DistributionTypes.Error.toString(r))
        }
      }
    }

    let oneValue = (
      ~fn: float => result<DistributionTypes.genericDist, string>,
      ~value: frValueDistOrNumber,
      ~env: DistributionOperation.env,
    ): result<DistributionTypes.genericDist, string> => {
      switch value {
      | FRValueNumber(a1) => fn(a1)
      | FRValueDist(a1) => Helpers.singleVarSample(a1, r => fn(r), env)
      }
    }

    let oneValueUsingSymbolicDist = (~fn, ~value) => oneValue(~fn=Helpers.wrapSymbolic(fn), ~value)

    let twoValues = (
      ~fn: ((float, float)) => result<DistributionTypes.genericDist, string>,
      ~values: (frValueDistOrNumber, frValueDistOrNumber),
      ~env: DistributionOperation.env,
    ): result<DistributionTypes.genericDist, string> => {
      switch values {
      | (FRValueNumber(a1), FRValueNumber(a2)) => fn((a1, a2))
      | (FRValueDist(a1), FRValueNumber(a2)) => Helpers.singleVarSample(a1, r => fn((r, a2)), env)
      | (FRValueNumber(a1), FRValueDist(a2)) => Helpers.singleVarSample(a2, r => fn((a1, r)), env)
      | (FRValueDist(a1), FRValueDist(a2)) => Helpers.twoVarSample(a1, a2, fn, env)
      }
    }

    let twoValuesUsingSymbolicDist = (~fn, ~values) =>
      twoValues(~fn=Helpers.wrapSymbolic(fn), ~values)
  }
}

module TwoArgDist = {
  let process = (~fn, ~env, r) =>
    r
    ->E.R.bind(Process.DistOrNumberToDist.twoValuesUsingSymbolicDist(~fn, ~values=_, ~env))
    ->E.R2.fmap(Wrappers.evDistribution)

  let make = (name, fn) => {
    FnDefinition.make(~name, ~inputs=[FRTypeDistOrNumber, FRTypeDistOrNumber], ~run=(inputs, env) =>
      inputs->Prepare.ToValueTuple.twoDistOrNumber->process(~fn, ~env)
    )
  }

  let makeRecordP5P95 = (name, fn) => {
    FnDefinition.make(
      ~name,
      ~inputs=[FRTypeRecord([("p5", FRTypeDistOrNumber), ("p95", FRTypeDistOrNumber)])],
      ~run=(inputs, env) => inputs->Prepare.ToValueTuple.Record.twoDistOrNumber->process(~fn, ~env),
    )
  }

  let makeRecordMeanStdev = (name, fn) => {
    FnDefinition.make(
      ~name,
      ~inputs=[FRTypeRecord([("mean", FRTypeDistOrNumber), ("stdev", FRTypeDistOrNumber)])],
      ~run=(inputs, env) => inputs->Prepare.ToValueTuple.Record.twoDistOrNumber->process(~fn, ~env),
    )
  }
}

module OneArgDist = {
  let process = (~fn, ~env, r) =>
    r
    ->E.R.bind(Process.DistOrNumberToDist.oneValueUsingSymbolicDist(~fn, ~value=_, ~env))
    ->E.R2.fmap(Wrappers.evDistribution)

  let make = (name, fn) => {
    FnDefinition.make(~name, ~inputs=[FRTypeDistOrNumber], ~run=(inputs, env) =>
      inputs->Prepare.ToValueTuple.oneDistOrNumber->process(~fn, ~env)
    )
  }
}
