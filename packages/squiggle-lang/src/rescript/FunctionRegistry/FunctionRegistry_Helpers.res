open FunctionRegistry_Core

let impossibleErrorString = "Wrong inputs / Logically impossible"
let impossibleError: errorValue = impossibleErrorString->REOther
let wrapError = e => Reducer_ErrorValue.REOther(e)

module Wrappers = {
  let symbolic = r => DistributionTypes.Symbolic(r)
  let pointSet = r => DistributionTypes.PointSet(r)
  let sampleSet = r => DistributionTypes.SampleSet(r)
  let evDistribution = r => Reducer_T.IEvDistribution(r)
  let evNumber = r => Reducer_T.IEvNumber(r)
  let evArray = r => Reducer_T.IEvArray(r)
  let evRecord = r => Reducer_T.IEvRecord(r)
  let evString = r => Reducer_T.IEvString(r)
  let symbolicEvDistribution = r => r->DistributionTypes.Symbolic->evDistribution
  let evArrayOfEvNumber = xs => xs->Belt.Array.map(evNumber)->evArray
}

let getOrError = (a, g) => E.A.get(a, g) |> E.O.toResult(impossibleErrorString)

module Prepare = {
  type t = frValue
  type ts = array<frValue>
  type err = string

  module ToValueArray = {
    module Record = {
      let twoArgs = (inputs: ts): result<ts, err> =>
        switch inputs {
        | [FRValueRecord([(_, n1), (_, n2)])] => Ok([n1, n2])
        | _ => Error(impossibleErrorString)
        }

      let threeArgs = (inputs: ts): result<ts, err> =>
        switch inputs {
        | [FRValueRecord([(_, n1), (_, n2), (_, n3)])] => Ok([n1, n2, n3])
        | _ => Error(impossibleErrorString)
        }

      let toArgs = (inputs: ts): result<ts, err> =>
        switch inputs {
        | [FRValueRecord(args)] => args->E.A2.fmap(((_, b)) => b)->Ok
        | _ => Error(impossibleErrorString)
        }
    }

    module Array = {
      let openA = (inputs: t): result<ts, err> =>
        switch inputs {
        | FRValueArray(n) => Ok(n)
        | _ => Error(impossibleErrorString)
        }

      let arrayOfArrays = (inputs: t): result<array<ts>, err> =>
        switch inputs {
        | FRValueArray(n) => n->E.A2.fmap(openA)->E.A.R.firstErrorOrOpen
        | _ => Error(impossibleErrorString)
        }
    }
  }

  module ToValueTuple = {
    let twoDistOrNumber = (values: ts): result<(frValueDistOrNumber, frValueDistOrNumber), err> => {
      switch values {
      | [FRValueDistOrNumber(a1), FRValueDistOrNumber(a2)] => Ok(a1, a2)
      | _ => Error(impossibleErrorString)
      }
    }

    let twoDist = (values: ts): result<
      (DistributionTypes.genericDist, DistributionTypes.genericDist),
      err,
    > => {
      switch values {
      | [FRValueDist(a1), FRValueDist(a2)] => Ok(a1, a2)
      | _ => Error(impossibleErrorString)
      }
    }

    let twoNumbers = (values: ts): result<(float, float), err> => {
      switch values {
      | [FRValueNumber(a1), FRValueNumber(a2)] => Ok(a1, a2)
      | _ => Error(impossibleErrorString)
      }
    }

    let threeNumbers = (values: ts): result<(float, float, float), err> => {
      switch values {
      | [FRValueNumber(a1), FRValueNumber(a2), FRValueNumber(a3)] => Ok(a1, a2, a3)
      | _ => Error(impossibleErrorString)
      }
    }

    let oneDistOrNumber = (values: ts): result<frValueDistOrNumber, err> => {
      switch values {
      | [FRValueDistOrNumber(a1)] => Ok(a1)
      | _ => Error(impossibleErrorString)
      }
    }

    module Record = {
      let twoDistOrNumber = (values: ts): result<(frValueDistOrNumber, frValueDistOrNumber), err> =>
        values->ToValueArray.Record.twoArgs->E.R.bind(twoDistOrNumber)

      let twoDist = (values: ts): result<
        (DistributionTypes.genericDist, DistributionTypes.genericDist),
        err,
      > => values->ToValueArray.Record.twoArgs->E.R.bind(twoDist)
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
    | _ => Error(impossibleErrorString)
    }
  }

  let oneDict = (values: t): result<Js.Dict.t<frValue>, err> => {
    switch values {
    | FRValueDict(a1) => Ok(a1)
    | _ => Error(impossibleErrorString)
    }
  }

  module ToTypedArray = {
    let numbers = (inputs: ts): result<array<float>, err> => {
      let openNumbers = (elements: array<t>) =>
        elements->E.A2.fmap(oneNumber)->E.A.R.firstErrorOrOpen
      inputs->getOrError(0)->E.R.bind(ToValueArray.Array.openA)->E.R.bind(openNumbers)
    }

    let dicts = (inputs: ts): Belt.Result.t<array<Js.Dict.t<frValue>>, err> => {
      let openDicts = (elements: array<t>) => elements->E.A2.fmap(oneDict)->E.A.R.firstErrorOrOpen
      inputs->getOrError(0)->E.R.bind(ToValueArray.Array.openA)->E.R.bind(openDicts)
    }
  }
}

module Process = {
  module DistOrNumberToDist = {
    module Helpers = {
      let toSampleSet = (r, env: GenericDist.env) => GenericDist.toSampleSetDist(r, env.sampleCount)

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
      ~env: GenericDist.env,
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
      ~env: GenericDist.env,
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

module DefineFn = {
  module Numbers = {
    let oneToOne = (name, fn) =>
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeNumber],
        ~run=(_, inputs, _, _) => {
          inputs
          ->getOrError(0)
          ->E.R.bind(Prepare.oneNumber)
          ->E.R2.fmap(fn)
          ->E.R2.fmap(Wrappers.evNumber)
          ->E.R2.errMap(e => Reducer_ErrorValue.REOther(e))
        },
        (),
      )
    let twoToOne = (name, fn) =>
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeNumber, FRTypeNumber],
        ~run=(_, inputs, _, _) => {
          inputs
          ->Prepare.ToValueTuple.twoNumbers
          ->E.R2.fmap(fn)
          ->E.R2.fmap(Wrappers.evNumber)
          ->E.R2.errMap(e => Reducer_ErrorValue.REOther(e))
        },
        (),
      )
    let threeToOne = (name, fn) =>
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeNumber, FRTypeNumber, FRTypeNumber],
        ~run=(_, inputs, _, _) => {
          inputs
          ->Prepare.ToValueTuple.threeNumbers
          ->E.R2.fmap(fn)
          ->E.R2.fmap(Wrappers.evNumber)
          ->E.R2.errMap(e => Reducer_ErrorValue.REOther(e))
        },
        (),
      )
  }
}
