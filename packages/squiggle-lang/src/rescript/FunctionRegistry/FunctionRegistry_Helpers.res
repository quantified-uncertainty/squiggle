open FunctionRegistry_Core

let impossibleError = "Wrong inputs / Logically impossible"

module Wrappers = {
  let symbolic = r => DistributionTypes.Symbolic(r)
  let evDistribution = r => ReducerInterface_ExpressionValue.EvDistribution(r)
  let evNumber = r => ReducerInterface_ExpressionValue.EvNumber(r)
  let evArray = r => ReducerInterface_ExpressionValue.EvArray(r)
  let evRecord = r => ReducerInterface_ExpressionValue.EvRecord(r)
  let evString = r => ReducerInterface_ExpressionValue.EvString(r)
  let symbolicEvDistribution = r => r->DistributionTypes.Symbolic->evDistribution
}

module Prepare = {
  type t = frValue
  type ts = array<frValue>
  type err = string

  module ToValueArray = {
    module Record = {
      let twoArgs = (inputs: ts): result<ts, err> =>
        switch inputs {
        | [FRValueRecord([(_, n1), (_, n2)])] => Ok([n1, n2])
        | _ => Error(impossibleError)
        }

      let toArgs = (inputs: ts): result<ts, err> =>
        switch inputs {
        | [FRValueRecord(args)] => args->E.A2.fmap(((_, b)) => b)->Ok
        | _ => Error(impossibleError)
        }
    }

    module Array = {
      let openA = (inputs: t): result<ts, err> =>
        switch inputs {
        | FRValueArray(n) => Ok(n)
        | _ => Error(impossibleError)
        }

      let arrayOfArrays = (inputs: t): result<array<ts>, err> =>
        switch inputs {
        | FRValueArray(n) => n->E.A2.fmap(openA)->E.A.R.firstErrorOrOpen
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

    let twoNumbers = (values: ts): result<(float, float), err> => {
      switch values {
      | [FRValueNumber(a1), FRValueNumber(a2)] => Ok(a1, a2)
      | _ => Error(impossibleError)
      }
    }

    let threeNumbers = (values: ts): result<(float, float, float), err> => {
      switch values {
      | [FRValueNumber(a1), FRValueNumber(a2), FRValueNumber(a3)] => Ok(a1, a2, a3)
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

  module ToArrayRecordPairs = {
    let twoArgs = (input: t): result<array<ts>, err> => {
      let array = input->ToValueArray.Array.openA
      let pairs =
        array->E.R.bind(pairs =>
          pairs
          ->E.A2.fmap(xyCoord => [xyCoord]->ToValueArray.Record.twoArgs)
          ->E.A.R.firstErrorOrOpen
        )
      pairs
    }
  }

  let oneNumber = (values: t): result<float, err> => {
    switch values {
    | FRValueNumber(a1) => Ok(a1)
    | _ => Error(impossibleError)
    }
  }

  let oneDict = (values: t): result<Js.Dict.t<frValue>, err> => {
    switch values {
    | FRValueDict(a1) => Ok(a1)
    | _ => Error(impossibleError)
    }
  }

  module ToTypedArray = {
    let numbers = (inputs: ts): result<array<float>, err> => {
      let openNumbers = (elements: array<t>) =>
        elements->E.A2.fmap(oneNumber)->E.A.R.firstErrorOrOpen
      inputs->E.A.unsafe_get(0)->ToValueArray.Array.openA->E.R.bind(openNumbers)
    }

    let dicts = (inputs: ts): Belt.Result.t<array<Js.Dict.t<frValue>>, err> => {
      let openDicts = (elements: array<t>) => elements->E.A2.fmap(oneDict)->E.A.R.firstErrorOrOpen
      inputs->E.A.unsafe_get(0)->ToValueArray.Array.openA->E.R.bind(openDicts)
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

  let make = (name, fn) =>
    FnDefinition.make(~name, ~inputs=[FRTypeDistOrNumber], ~run=(inputs, env) =>
      inputs->Prepare.ToValueTuple.oneDistOrNumber->process(~fn, ~env)
    )
}

module ArrayNumberDist = {
  let make = (name, fn) => {
    FnDefinition.make(~name, ~inputs=[FRTypeArray(FRTypeNumber)], ~run=(inputs, _) =>
      Prepare.ToTypedArray.numbers(inputs)
      ->E.R.bind(r => E.A.length(r) === 0 ? Error("List is empty") : Ok(r))
      ->E.R.bind(fn)
    )
  }
  let make2 = (name, fn) => {
    FnDefinition.make(~name, ~inputs=[FRTypeArray(FRTypeAny)], ~run=(inputs, _) =>
      Prepare.ToTypedArray.numbers(inputs)
      ->E.R.bind(r => E.A.length(r) === 0 ? Error("List is empty") : Ok(r))
      ->E.R.bind(fn)
    )
  }
}

module NumberToNumber = {
  let make = (name, fn) =>
    FnDefinition.make(~name, ~inputs=[FRTypeNumber], ~run=(inputs, _) => {
      let num =
        inputs->E.A.unsafe_get(0)->Prepare.oneNumber->E.R2.fmap(fn)->E.R2.fmap(Wrappers.evNumber)
      num
    })
}
