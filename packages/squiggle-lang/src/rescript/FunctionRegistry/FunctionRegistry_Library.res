open FunctionRegistry_Core
open FunctionRegistry_Helpers

let twoArgs = E.Tuple2.toFnCall

module Declaration = {
  let frType = FRTypeRecord([
    ("fn", FRTypeLambda),
    ("inputs", FRTypeArray(FRTypeRecord([("min", FRTypeNumber), ("max", FRTypeNumber)]))),
  ])

  let fromExpressionValue = (e: frValue): result<internalExpressionValue, string> => {
    switch FunctionRegistry_Helpers.Prepare.ToValueArray.Record.twoArgs([e]) {
    | Ok([FRValueLambda(lambda), FRValueArray(inputs)]) => {
        open FunctionRegistry_Helpers.Prepare
        let getMinMax = arg =>
          ToValueArray.Record.toArgs([arg])
          ->E.R.bind(ToValueTuple.twoNumbers)
          ->E.R2.fmap(((min, max)) => Declaration.ContinuousFloatArg.make(min, max))
        inputs
        ->E.A2.fmap(getMinMax)
        ->E.A.R.firstErrorOrOpen
        ->E.R2.fmap(args => ReducerInterface_InternalExpressionValue.IEvDeclaration(
          Declaration.make(lambda, args),
        ))
      }
    | Error(r) => Error(r)
    | Ok(_) => Error(FunctionRegistry_Helpers.impossibleError)
    }
  }
}

module PointSet = {
  let nameSpace = "PointSet"
  let requiresNamespace = true

  let inputsTodist = (inputs: array<FunctionRegistry_Core.frValue>, makeDist) => {
    let array = inputs->getOrError(0)->E.R.bind(Prepare.ToValueArray.Array.openA)
    let xyCoords =
      array->E.R.bind(xyCoords =>
        xyCoords
        ->E.A2.fmap(xyCoord =>
          [xyCoord]->Prepare.ToValueArray.Record.twoArgs->E.R.bind(Prepare.ToValueTuple.twoNumbers)
        )
        ->E.A.R.firstErrorOrOpen
      )
    let expressionValue =
      xyCoords
      ->E.R.bind(r => r->XYShape.T.makeFromZipped->E.R2.errMap(XYShape.Error.toString))
      ->E.R2.fmap(r => ReducerInterface_InternalExpressionValue.IEvDistribution(
        PointSet(makeDist(r)),
      ))
    expressionValue
  }

  let library = [
    Function.make(
      ~name="makeContinuous",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace,
          ~name="makeContinuous",
          ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
          ~run=(_, inputs, _) => inputsTodist(inputs, r => Continuous(Continuous.make(r))),
          (),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="makeDiscrete",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace,
          ~name="makeDiscrete",
          ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
          ~run=(_, inputs, _) => inputsTodist(inputs, r => Discrete(Discrete.make(r))),
          (),
        ),
      ],
      (),
    ),
  ]
}

module Functionn = {
  let nameSpace = "Function"
  let library = [
    Function.make(
      ~name="declare",
      ~nameSpace,
      ~description="Adds metadata to a function of the input ranges. Works now for numeric and date inputs. This is useful when making predictions. It allows you to limit the domain that your prediction will be used and scored within.",
      ~examples=[
        `declareFn({
  fn: {|a,b| a },
  inputs: [
    {min: 0, max: 100},
    {min: 30, max: 50}
  ]
})`,
      ],
      ~isExperimental=true,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace=true,
          ~name="declare",
          ~inputs=[Declaration.frType],
          ~run=(_, inputs, _) => {
            inputs->getOrError(0)->E.R.bind(Declaration.fromExpressionValue)
          },
          (),
        ),
      ],
      (),
    ),
  ]
}

module DistributionCreation = {
  let nameSpace = "Dist"
  module TwoArgDist = {
    let process = (~fn, ~env, r) =>
      r
      ->E.R.bind(Process.DistOrNumberToDist.twoValuesUsingSymbolicDist(~fn, ~values=_, ~env))
      ->E.R2.fmap(Wrappers.evDistribution)

    let make = (name, fn) => {
      FnDefinition.make(
        ~requiresNamespace=false,
        ~name,
        ~inputs=[FRTypeDistOrNumber, FRTypeDistOrNumber],
        ~run=(_, inputs, env) => inputs->Prepare.ToValueTuple.twoDistOrNumber->process(~fn, ~env),
        (),
      )
    }

    let makeRecordP5P95 = (name, fn) => {
      FnDefinition.make(
        ~requiresNamespace=false,
        ~name,
        ~inputs=[FRTypeRecord([("p5", FRTypeDistOrNumber), ("p95", FRTypeDistOrNumber)])],
        ~run=(_, inputs, env) =>
          inputs->Prepare.ToValueTuple.Record.twoDistOrNumber->process(~fn, ~env),
        (),
      )
    }

    let makeRecordMeanStdev = (name, fn) => {
      FnDefinition.make(
        ~name,
        ~requiresNamespace=false,
        ~inputs=[FRTypeRecord([("mean", FRTypeDistOrNumber), ("stdev", FRTypeDistOrNumber)])],
        ~run=(_, inputs, env) =>
          inputs->Prepare.ToValueTuple.Record.twoDistOrNumber->process(~fn, ~env),
        (),
      )
    }
  }

  module OneArgDist = {
    let process = (~fn, ~env, r) =>
      r
      ->E.R.bind(Process.DistOrNumberToDist.oneValueUsingSymbolicDist(~fn, ~value=_, ~env))
      ->E.R2.fmap(Wrappers.evDistribution)

    let make = (name, fn) =>
      FnDefinition.make(
        ~requiresNamespace=false,
        ~name,
        ~inputs=[FRTypeDistOrNumber],
        ~run=(_, inputs, env) => inputs->Prepare.ToValueTuple.oneDistOrNumber->process(~fn, ~env),
        (),
      )
  }

  let library = [
    Function.make(
      ~name="normal",
      ~nameSpace,
      ~examples=["normal(5,1)", "normal({p5: 4, p95: 10})", "normal({mean: 5, stdev: 2})"],
      ~definitions=[
        TwoArgDist.make("normal", twoArgs(SymbolicDist.Normal.make)),
        TwoArgDist.makeRecordP5P95("normal", r =>
          twoArgs(SymbolicDist.Normal.from90PercentCI, r)->Ok
        ),
        TwoArgDist.makeRecordMeanStdev("normal", twoArgs(SymbolicDist.Normal.make)),
      ],
      (),
    ),
    Function.make(
      ~name="lognormal",
      ~nameSpace,
      ~examples=[
        "lognormal(0.5, 0.8)",
        "lognormal({p5: 4, p95: 10})",
        "lognormal({mean: 5, stdev: 2})",
      ],
      ~definitions=[
        TwoArgDist.make("lognormal", twoArgs(SymbolicDist.Lognormal.make)),
        TwoArgDist.makeRecordP5P95("lognormal", r =>
          twoArgs(SymbolicDist.Lognormal.from90PercentCI, r)->Ok
        ),
        TwoArgDist.makeRecordMeanStdev(
          "lognormal",
          twoArgs(SymbolicDist.Lognormal.fromMeanAndStdev),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="uniform",
      ~nameSpace,
      ~examples=[`uniform(10, 12)`],
      ~definitions=[TwoArgDist.make("uniform", twoArgs(SymbolicDist.Uniform.make))],
      (),
    ),
    Function.make(
      ~name="beta",
      ~nameSpace,
      ~examples=[`beta(20, 25)`, `beta({mean: 0.39, stdev: 0.1})`],
      ~definitions=[
        TwoArgDist.make("beta", twoArgs(SymbolicDist.Beta.make)),
        TwoArgDist.makeRecordMeanStdev("beta", twoArgs(SymbolicDist.Beta.fromMeanAndStdev)),
      ],
      (),
    ),
    Function.make(
      ~name="cauchy",
      ~nameSpace,
      ~examples=[`cauchy(5, 1)`],
      ~definitions=[TwoArgDist.make("cauchy", twoArgs(SymbolicDist.Cauchy.make))],
      (),
    ),
    Function.make(
      ~name="gamma",
      ~nameSpace,
      ~examples=[`gamma(5, 1)`],
      ~definitions=[TwoArgDist.make("gamma", twoArgs(SymbolicDist.Gamma.make))],
      (),
    ),
    Function.make(
      ~name="logistic",
      ~nameSpace,
      ~examples=[`logistic(5, 1)`],
      ~definitions=[TwoArgDist.make("logistic", twoArgs(SymbolicDist.Logistic.make))],
      (),
    ),
    Function.make(
      ~name="to (distribution)",
      ~nameSpace,
      ~examples=[`5 to 10`, `to(5,10)`, `-5 to 5`],
      ~definitions=[
        TwoArgDist.make("to", twoArgs(SymbolicDist.From90thPercentile.make)),
        TwoArgDist.make(
          "credibleIntervalToDistribution",
          twoArgs(SymbolicDist.From90thPercentile.make),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="exponential",
      ~nameSpace,
      ~examples=[`exponential(2)`],
      ~definitions=[OneArgDist.make("exponential", SymbolicDist.Exponential.make)],
      (),
    ),
    Function.make(
      ~name="bernoulli",
      ~nameSpace,
      ~examples=[`bernoulli(0.5)`],
      ~definitions=[OneArgDist.make("bernoulli", SymbolicDist.Bernoulli.make)],
      (),
    ),
    Function.make(
      ~name="pointMass",
      ~nameSpace,
      ~examples=[`pointMass(0.5)`],
      ~definitions=[OneArgDist.make("pointMass", SymbolicDist.Float.makeSafe)],
      (),
    ),
  ]
}

module Number = {
  let nameSpace = "Number"
  let requiresNamespace = false

  module NumberToNumber = {
    let make = (name, fn) =>
      FnDefinition.make(
        ~requiresNamespace,
        ~name,
        ~inputs=[FRTypeNumber],
        ~run=(_, inputs, _) => {
          inputs
          ->getOrError(0)
          ->E.R.bind(Prepare.oneNumber)
          ->E.R2.fmap(fn)
          ->E.R2.fmap(Wrappers.evNumber)
        },
        (),
      )
  }

  module ArrayNumberDist = {
    let make = (name, fn) => {
      FnDefinition.make(
        ~requiresNamespace=false,
        ~name,
        ~inputs=[FRTypeArray(FRTypeNumber)],
        ~run=(_, inputs, _) =>
          Prepare.ToTypedArray.numbers(inputs)
          ->E.R.bind(r => E.A.length(r) === 0 ? Error("List is empty") : Ok(r))
          ->E.R.bind(fn),
        (),
      )
    }
    let make2 = (name, fn) => {
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeArray(FRTypeAny)],
        ~run=(_, inputs, _) =>
          Prepare.ToTypedArray.numbers(inputs)
          ->E.R.bind(r => E.A.length(r) === 0 ? Error("List is empty") : Ok(r))
          ->E.R.bind(fn),
        (),
      )
    }
  }

  let library = [
    Function.make(
      ~name="floor",
      ~nameSpace,
      ~definitions=[NumberToNumber.make("floor", Js.Math.floor_float)],
      (),
    ),
    Function.make(
      ~name="ceiling",
      ~nameSpace,
      ~definitions=[NumberToNumber.make("ceil", Js.Math.ceil_float)],
      (),
    ),
    Function.make(
      ~name="absolute value",
      ~nameSpace,
      ~definitions=[NumberToNumber.make("abs", Js.Math.abs_float)],
      (),
    ),
    Function.make(
      ~name="exponent",
      ~nameSpace,
      ~definitions=[NumberToNumber.make("exp", Js.Math.exp)],
      (),
    ),
    Function.make(
      ~name="log",
      ~nameSpace,
      ~definitions=[NumberToNumber.make("log", Js.Math.log)],
      (),
    ),
    Function.make(
      ~name="log base 10",
      ~nameSpace,
      ~definitions=[NumberToNumber.make("log10", Js.Math.log10)],
      (),
    ),
    Function.make(
      ~name="log base 2",
      ~nameSpace,
      ~definitions=[NumberToNumber.make("log2", Js.Math.log2)],
      (),
    ),
    Function.make(
      ~name="round",
      ~nameSpace,
      ~definitions=[NumberToNumber.make("round", Js.Math.round)],
      (),
    ),
    Function.make(
      ~name="sum",
      ~nameSpace,
      ~definitions=[ArrayNumberDist.make("sum", r => r->E.A.Floats.sum->Wrappers.evNumber->Ok)],
      (),
    ),
    Function.make(
      ~name="product",
      ~nameSpace,
      ~definitions=[
        ArrayNumberDist.make("product", r => r->E.A.Floats.product->Wrappers.evNumber->Ok),
      ],
      (),
    ),
    Function.make(
      ~name="min",
      ~nameSpace,
      ~definitions=[ArrayNumberDist.make("min", r => r->E.A.Floats.min->Wrappers.evNumber->Ok)],
      (),
    ),
    Function.make(
      ~name="max",
      ~nameSpace,
      ~definitions=[ArrayNumberDist.make("max", r => r->E.A.Floats.max->Wrappers.evNumber->Ok)],
      (),
    ),
    Function.make(
      ~name="mean",
      ~nameSpace,
      ~definitions=[ArrayNumberDist.make("mean", r => r->E.A.Floats.mean->Wrappers.evNumber->Ok)],
      (),
    ),
    Function.make(
      ~name="geometric mean",
      ~nameSpace,
      ~definitions=[
        ArrayNumberDist.make("geomean", r => r->E.A.Floats.geomean->Wrappers.evNumber->Ok),
      ],
      (),
    ),
    Function.make(
      ~name="standard deviation",
      ~nameSpace,
      ~definitions=[ArrayNumberDist.make("stdev", r => r->E.A.Floats.stdev->Wrappers.evNumber->Ok)],
      (),
    ),
    Function.make(
      ~name="variance",
      ~nameSpace,
      ~definitions=[
        ArrayNumberDist.make("variance", r => r->E.A.Floats.stdev->Wrappers.evNumber->Ok),
      ],
      (),
    ),
    Function.make(
      ~name="sort",
      ~nameSpace,
      ~definitions=[
        ArrayNumberDist.make("sort", r =>
          r->E.A.Floats.sort->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
        ),
      ],
      (),
    ),
    Function.make(
      ~name="cumulative sum",
      ~nameSpace,
      ~definitions=[
        ArrayNumberDist.make("cumsum", r =>
          r->E.A.Floats.cumsum->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
        ),
      ],
      (),
    ),
    Function.make(
      ~name="cumulative prod",
      ~nameSpace,
      ~definitions=[
        ArrayNumberDist.make("cumprod", r =>
          r->E.A.Floats.cumsum->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
        ),
      ],
      (),
    ),
    Function.make(
      ~name="diff",
      ~nameSpace,
      ~definitions=[
        ArrayNumberDist.make("diff", r =>
          r->E.A.Floats.diff->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
        ),
      ],
      (),
    ),
  ]
}

module Dict = {
  let nameSpace = "Dict"
  module Internals = {
    type t = ReducerInterface_InternalExpressionValue.map

    let keys = (a: t): internalExpressionValue => IEvArray(
      Belt.Map.String.keysToArray(a)->E.A2.fmap(Wrappers.evString),
    )

    let values = (a: t): internalExpressionValue => IEvArray(Belt.Map.String.valuesToArray(a))

    let toList = (a: t): internalExpressionValue =>
      Belt.Map.String.toArray(a)
      ->E.A2.fmap(((key, value)) => Wrappers.evArray([IEvString(key), value]))
      ->Wrappers.evArray

    let fromList = (items: array<internalExpressionValue>): result<
      internalExpressionValue,
      string,
    > =>
      items
      ->E.A2.fmap(item => {
        switch (item: internalExpressionValue) {
        | IEvArray([IEvString(string), value]) => (string, value)->Ok
        | _ => Error(impossibleError)
        }
      })
      ->E.A.R.firstErrorOrOpen
      ->E.R2.fmap(Belt.Map.String.fromArray)
      ->E.R2.fmap(Wrappers.evRecord)

    let merge = (a: t, b: t): internalExpressionValue => IEvRecord(
      Belt.Map.String.merge(a, b, (_, _, c) => c),
    )

    //Belt.Map.String has a function for mergeMany, but I couldn't understand how to use it yet.
    let mergeMany = (a: array<t>): internalExpressionValue => {
      let mergedValues =
        a->E.A2.fmap(Belt.Map.String.toArray)->Belt.Array.concatMany->Belt.Map.String.fromArray
      IEvRecord(mergedValues)
    }
  }

  let library = [
    Function.make(
      ~name="merge",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace=true,
          ~name="merge",
          ~inputs=[FRTypeDict(FRTypeAny), FRTypeDict(FRTypeAny)],
          ~run=(inputs, _, _) => {
            switch inputs {
            | [IEvRecord(d1), IEvRecord(d2)] => Internals.merge(d1, d2)->Ok
            | _ => Error(impossibleError)
            }
          },
          (),
        ),
      ],
      (),
    ),
    //TODO: Change to use new mergeMany() function.
    Function.make(
      ~name="mergeMany",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace=true,
          ~name="mergeMany",
          ~inputs=[FRTypeArray(FRTypeDict(FRTypeAny))],
          ~run=(_, inputs, _) =>
            inputs
            ->Prepare.ToTypedArray.dicts
            ->E.R2.fmap(E.Dict.concatMany)
            ->E.R2.fmap(Js.Dict.map((. r) => FunctionRegistry_Core.FRType.matchReverse(r)))
            ->E.R2.fmap(r => r->Js.Dict.entries->Belt.Map.String.fromArray)
            ->E.R2.fmap(Wrappers.evRecord),
          (),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="keys",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace=true,
          ~name="keys",
          ~inputs=[FRTypeDict(FRTypeAny)],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvRecord(d1)] => Internals.keys(d1)->Ok
            | _ => Error(impossibleError)
            },
          (),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="values",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace=true,
          ~name="values",
          ~inputs=[FRTypeDict(FRTypeAny)],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvRecord(d1)] => Internals.values(d1)->Ok
            | _ => Error(impossibleError)
            },
          (),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="toList",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace=true,
          ~name="toList",
          ~inputs=[FRTypeDict(FRTypeAny)],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvRecord(dict)] => dict->Internals.toList->Ok
            | _ => Error(impossibleError)
            },
          (),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="fromList",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace=true,
          ~name="fromList",
          ~inputs=[FRTypeArray(FRTypeArray(FRTypeAny))],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvArray(items)] => Internals.fromList(items)
            | _ => Error(impossibleError)
            },
          (),
        ),
      ],
      (),
    ),
  ]
}

module List = {
  let nameSpace = "List"
  let requiresNamespace = true

  module Internals = {
    let makeFromNumber = (
      n: float,
      value: internalExpressionValue,
    ): internalExpressionValue => IEvArray(Belt.Array.make(E.Float.toInt(n), value))

    let upTo = (low: float, high: float): internalExpressionValue => IEvArray(
      E.A.Floats.range(low, high, (high -. low +. 1.0)->E.Float.toInt)->E.A2.fmap(
        Wrappers.evNumber,
      ),
    )

    let first = (v: array<internalExpressionValue>): result<internalExpressionValue, string> =>
      v->E.A.first |> E.O.toResult("No first element")

    let last = (v: array<internalExpressionValue>): result<internalExpressionValue, string> =>
      v->E.A.last |> E.O.toResult("No last element")

    let reverse = (array: array<internalExpressionValue>): internalExpressionValue => IEvArray(
      Belt.Array.reverse(array),
    )
  }

  let library = [
    Function.make(
      ~name="make",
      ~nameSpace,
      ~definitions=[
        //Todo: If the second item is a function with no args, it could be nice to run this function and return the result.
        FnDefinition.make(
          ~requiresNamespace,
          ~name="make",
          ~inputs=[FRTypeNumber, FRTypeAny],
          ~run=(inputs, _, _) => {
            switch inputs {
            | [IEvNumber(number), value] => Internals.makeFromNumber(number, value)->Ok
            | _ => Error(impossibleError)
            }
          },
          (),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="upTo",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace,
          ~name="upTo",
          ~inputs=[FRTypeNumber, FRTypeNumber],
          ~run=(_, inputs, _) =>
            inputs
            ->Prepare.ToValueTuple.twoNumbers
            ->E.R2.fmap(((low, high)) => Internals.upTo(low, high)),
          (),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="first",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace,
          ~name="first",
          ~inputs=[FRTypeArray(FRTypeAny)],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvArray(array)] => Internals.first(array)
            | _ => Error(impossibleError)
            },
          (),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="last",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace=false,
          ~name="last",
          ~inputs=[FRTypeArray(FRTypeAny)],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvArray(array)] => Internals.last(array)
            | _ => Error(impossibleError)
            },
          (),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="reverse",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace=false,
          ~name="reverse",
          ~inputs=[FRTypeArray(FRTypeAny)],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvArray(array)] => Internals.reverse(array)->Ok
            | _ => Error(impossibleError)
            },
          (),
        ),
      ],
      (),
    ),
  ]
}

module Scoring = {
  let nameSpace = "Dist"
  let requiresNamespace = false

  let runScoring = (estimate, answer, prior, env) => {
    GenericDist.Score.logScore(~estimate, ~answer, ~prior, ~env)
    ->E.R2.fmap(FunctionRegistry_Helpers.Wrappers.evNumber)
    ->E.R2.errMap(DistributionTypes.Error.toString)
  }

  let library = [
    Function.make(
      ~name="logScore",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~requiresNamespace,
          ~name="logScore",
          ~inputs=[
            FRTypeRecord([
              ("estimate", FRTypeDist),
              ("answer", FRTypeDistOrNumber),
              ("prior", FRTypeDist),
            ]),
          ],
          ~run=(_, inputs, env) => {
            switch FunctionRegistry_Helpers.Prepare.ToValueArray.Record.threeArgs(inputs) {
            | Ok([
                FRValueDist(estimate),
                FRValueDistOrNumber(FRValueDist(d)),
                FRValueDist(prior),
              ]) =>
              runScoring(estimate, Score_Dist(d), Some(prior), env)
            | Ok([
                FRValueDist(estimate),
                FRValueDistOrNumber(FRValueNumber(d)),
                FRValueDist(prior),
              ]) =>
              runScoring(estimate, Score_Scalar(d), Some(prior), env)
            | Error(e) => Error(e)
            | _ => Error(FunctionRegistry_Helpers.impossibleError)
            }
          },
          (),
        ),
        FnDefinition.make(
          ~name="logScore",
          ~requiresNamespace,
          ~inputs=[FRTypeRecord([("estimate", FRTypeDist), ("answer", FRTypeDistOrNumber)])],
          ~run=(_, inputs, env) => {
            switch FunctionRegistry_Helpers.Prepare.ToValueArray.Record.twoArgs(inputs) {
            | Ok([FRValueDist(estimate), FRValueDistOrNumber(FRValueDist(d))]) =>
              runScoring(estimate, Score_Dist(d), None, env)
            | Ok([FRValueDist(estimate), FRValueDistOrNumber(FRValueNumber(d))]) =>
              runScoring(estimate, Score_Scalar(d), None, env)
            | Error(e) => Error(e)
            | _ => Error(FunctionRegistry_Helpers.impossibleError)
            }
          },
          (),
        ),
      ],
      (),
    ),
    Function.make(
      ~name="klDivergence",
      ~nameSpace,
      ~definitions=[
        FnDefinition.make(
          ~name="klDivergence",
          ~requiresNamespace,
          ~inputs=[FRTypeDist, FRTypeDist],
          ~run=(_, inputs, env) => {
            switch inputs {
            | [FRValueDist(estimate), FRValueDist(d)] =>
              runScoring(estimate, Score_Dist(d), None, env)
            | _ => Error(FunctionRegistry_Helpers.impossibleError)
            }
          },
          (),
        ),
      ],
      (),
    ),
  ]
}

let registry = Belt.Array.concatMany([
  PointSet.library,
  Functionn.library,
  Number.library,
  Dict.library,
  List.library,
  DistributionCreation.library,
  Scoring.library,
])
