open FunctionRegistry_Core
open Reducer_T

let impossibleErrorString = "Wrong inputs / Logically impossible"
let impossibleError: errorMessage = impossibleErrorString->SqError.Message.REOther
let wrapError = e => SqError.Message.REOther(e)

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
  let evArrayOfEvNumber = xs => xs->E.A.fmap(evNumber)->evArray
}

let getOrError = (a, g) => E.A.get(a, g)->E.O.toResult(impossibleErrorString)

module Prepare = {
  type t = value
  type ts = array<value>
  type err = string

  module ToValueArray = {
    module Record = {
      let twoArgs = (inputs: ts, (arg1: string, arg2: string)): result<ts, err> =>
        switch inputs {
        | [IEvRecord(map)] => {
            let n1 = map->Belt.Map.String.getExn(arg1)
            let n2 = map->Belt.Map.String.getExn(arg2)
            Ok([n1, n2])
          }

        | _ => Error(impossibleErrorString)
        }

      let threeArgs = (inputs: ts, (arg1: string, arg2: string, arg3: string)): result<ts, err> =>
        switch inputs {
        | [IEvRecord(map)] => {
            let n1 = map->Belt.Map.String.getExn(arg1)
            let n2 = map->Belt.Map.String.getExn(arg2)
            let n3 = map->Belt.Map.String.getExn(arg3)
            Ok([n1, n2, n3])
          }

        | _ => Error(impossibleErrorString)
        }
    }

    module Array = {
      let openA = (inputs: t): result<ts, err> =>
        switch inputs {
        | IEvArray(n) => Ok(n)
        | _ => Error(impossibleErrorString)
        }

      let arrayOfArrays = (inputs: t): result<array<ts>, err> =>
        switch inputs {
        | IEvArray(n) => n->E.A.fmap(openA)->E.A.R.firstErrorOrOpen
        | _ => Error(impossibleErrorString)
        }
    }
  }

  module ToValueTuple = {
    let twoDistOrNumber = (values: ts): result<(frValueDistOrNumber, frValueDistOrNumber), err> => {
      switch values {
      | [IEvDistribution(a1), IEvDistribution(a2)] => Ok(FRValueDist(a1), FRValueDist(a2))
      | [IEvDistribution(a1), IEvNumber(a2)] => Ok(FRValueDist(a1), FRValueNumber(a2))
      | [IEvNumber(a1), IEvDistribution(a2)] => Ok(FRValueNumber(a1), FRValueDist(a2))
      | [IEvNumber(a1), IEvNumber(a2)] => Ok(FRValueNumber(a1), FRValueNumber(a2))
      | _ => Error(impossibleErrorString)
      }
    }

    let twoDist = (values: ts): result<
      (DistributionTypes.genericDist, DistributionTypes.genericDist),
      err,
    > => {
      switch values {
      | [IEvDistribution(a1), IEvDistribution(a2)] => Ok(a1, a2)
      | _ => Error(impossibleErrorString)
      }
    }

    let twoNumbers = (values: ts): result<(float, float), err> => {
      switch values {
      | [IEvNumber(a1), IEvNumber(a2)] => Ok(a1, a2)
      | _ => Error(impossibleErrorString)
      }
    }

    let threeNumbers = (values: ts): result<(float, float, float), err> => {
      switch values {
      | [IEvNumber(a1), IEvNumber(a2), IEvNumber(a3)] => Ok(a1, a2, a3)
      | _ => Error(impossibleErrorString)
      }
    }

    let oneDistOrNumber = (values: ts): result<frValueDistOrNumber, err> => {
      switch values {
      | [IEvNumber(a1)] => FRValueNumber(a1)->Ok
      | [IEvDistribution(a2)] => FRValueDist(a2)->Ok
      | _ => Error(impossibleErrorString)
      }
    }

    module Record = {
      let twoDistOrNumber = (values: ts, labels: (string, string)): result<
        (frValueDistOrNumber, frValueDistOrNumber),
        err,
      > => values->ToValueArray.Record.twoArgs(labels)->E.R.bind(twoDistOrNumber)

      let twoDist = (values: ts, labels: (string, string)): result<
        (DistributionTypes.genericDist, DistributionTypes.genericDist),
        err,
      > => values->ToValueArray.Record.twoArgs(labels)->E.R.bind(twoDist)
    }
  }

  let oneNumber = (value: t): result<float, err> => {
    switch value {
    | IEvNumber(a1) => Ok(a1)
    | _ => Error(impossibleErrorString)
    }
  }

  let oneDict = (value: t): result<Reducer_T.map, err> => {
    switch value {
    | IEvRecord(a1) => Ok(a1)
    | _ => Error(impossibleErrorString)
    }
  }

  module ToTypedArray = {
    let numbers = (inputs: ts): result<array<float>, err> => {
      let openNumbers = (elements: array<t>) =>
        elements->E.A.fmap(oneNumber)->E.A.R.firstErrorOrOpen
      inputs->getOrError(0)->E.R.bind(ToValueArray.Array.openA)->E.R.bind(openNumbers)
    }

    let dicts = (inputs: ts): Belt.Result.t<array<Reducer_T.map>, err> => {
      let openDicts = (elements: array<t>) => elements->E.A.fmap(oneDict)->E.A.R.firstErrorOrOpen
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

      let wrapSymbolic = (fn, r) => r->fn->E.R.fmap(Wrappers.symbolic)

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
        ~run=(inputs, _, _) => {
          switch inputs {
          | [IEvNumber(x)] => fn(x)->IEvNumber->Ok
          | _ => Error(impossibleError)
          }
        },
        (),
      )
    let twoToOne = (name, fn) =>
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeNumber, FRTypeNumber],
        ~run=(inputs, _, _) => {
          switch inputs {
          | [IEvNumber(x), IEvNumber(y)] => fn(x, y)->IEvNumber->Ok
          | _ => Error(impossibleError)
          }
        },
        (),
      )
    let threeToOne = (name, fn) =>
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeNumber, FRTypeNumber, FRTypeNumber],
        ~run=(inputs, _, _) => {
          switch inputs {
          | [IEvNumber(x), IEvNumber(y), IEvNumber(z)] => fn(x, y, z)->IEvNumber->Ok
          | _ => Error(impossibleError)
          }
        },
        (),
      )
  }
}

module Make = {
  /*
  Opinionated explanations for API choices here:

  Q: Why such short names?
  A: Because we have to type them a lot in definitions.

  Q: Why not DefineFn.Numbers.oneToOne / DefineFn.Numbers.twoToOne / ...?
  A: Because return values matter too, and we have many possible combinations: numbers to numbers, pairs of numbers to numbers, pair of numbers to bools.

  Q: Does this approach scale?
  A: It's good enough for most cases, and we can fall back on raw `Function.make` if necessary. We should figure out the better API powered by parameterized types, but it's hard (and might require PPX).

  Q: What about `frValue` types?
  A: I hope we'll get rid of them soon.

  Q: What about polymorphic functions with multiple definitions? Why ~fn is not an array?
  A: We often define the same function in multiple `FR_*` files, so that doesn't work well anyway. In 90%+ cases there's a single definition. And having to write `name` twice is annoying.
 */
  let f2f = (
    ~name: string,
    ~fn: float => float,
    ~nameSpace="",
    ~requiresNamespace=false,
    ~examples=?,
    (),
  ) => {
    Function.make(
      ~name,
      ~nameSpace,
      ~requiresNamespace,
      ~examples=examples->E.O.default([]),
      ~output=EvtNumber,
      ~definitions=[
        FnDefinition.make(
          ~name,
          ~inputs=[FRTypeNumber],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvNumber(x)] => fn(x)->IEvNumber->Ok
            | _ => Error(impossibleError)
            },
          (),
        ),
      ],
      (),
    )
  }

  let ff2f = (
    ~name: string,
    ~fn: (float, float) => float,
    ~nameSpace="",
    ~requiresNamespace=false,
    ~examples=?,
    (),
  ) => {
    Function.make(
      ~name,
      ~nameSpace,
      ~requiresNamespace,
      ~examples=examples->E.O.default([]),
      ~output=EvtNumber,
      ~definitions=[
        FnDefinition.make(
          ~name,
          ~inputs=[FRTypeNumber, FRTypeNumber],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvNumber(x), IEvNumber(y)] => fn(x, y)->IEvNumber->Ok
            | _ => Error(impossibleError)
            },
          (),
        ),
      ],
      (),
    )
  }

  let ff2b = (
    ~name: string,
    ~fn: (float, float) => bool,
    ~nameSpace="",
    ~requiresNamespace=false,
    ~examples=?,
    (),
  ) => {
    Function.make(
      ~name,
      ~nameSpace,
      ~requiresNamespace,
      ~examples=examples->E.O.default([]),
      ~output=EvtBool,
      ~definitions=[
        FnDefinition.make(
          ~name,
          ~inputs=[FRTypeNumber, FRTypeNumber],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvNumber(x), IEvNumber(y)] => fn(x, y)->IEvBool->Ok
            | _ => Error(impossibleError)
            },
          (),
        ),
      ],
      (),
    )
  }

  let bb2b = (
    ~name: string,
    ~fn: (bool, bool) => bool,
    ~nameSpace="",
    ~requiresNamespace=false,
    ~examples=?,
    (),
  ) => {
    Function.make(
      ~name,
      ~nameSpace,
      ~requiresNamespace,
      ~examples=examples->E.O.default([]),
      ~output=EvtBool,
      ~definitions=[
        FnDefinition.make(
          ~name,
          ~inputs=[FRTypeBool, FRTypeBool],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvBool(x), IEvBool(y)] => fn(x, y)->IEvBool->Ok
            | _ => Error(impossibleError)
            },
          (),
        ),
      ],
      (),
    )
  }
}
