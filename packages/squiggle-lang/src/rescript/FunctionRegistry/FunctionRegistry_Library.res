open FunctionRegistry_Core
open FunctionRegistry_Helpers

let twoArgs = E.Tuple2.toFnCall

module Declaration = {
  let frType = FRTypeRecord([
    ("fn", FRTypeLambda),
    ("inputs", FRTypeArray(FRTypeRecord([("min", FRTypeNumber), ("max", FRTypeNumber)]))),
  ])

  let fromExpressionValue = (e: frValue): result<expressionValue, string> => {
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

let registry = [
  Function.make(
    ~name="toContinuousPointSet",
    ~definitions=[
      FnDefinition.make(
        ~name="toContinuousPointSet",
        ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
        ~run=(inputs, _) => inputsTodist(inputs, r => Continuous(Continuous.make(r))),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="toDiscretePointSet",
    ~definitions=[
      FnDefinition.make(
        ~name="toDiscretePointSet",
        ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
        ~run=(inputs, _) => inputsTodist(inputs, r => Discrete(Discrete.make(r))),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Declaration",
    ~definitions=[
      FnDefinition.make(~name="declareFn", ~inputs=[Declaration.frType], ~run=(inputs, _) => {
        inputs->getOrError(0)->E.R.bind(Declaration.fromExpressionValue)
      }),
    ],
    (),
  ),
  Function.make(
    ~name="Normal",
    ~examples=`normal(5,1)
normal({p5: 4, p95: 10})
normal({mean: 5, stdev: 2})`,
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
    ~name="Lognormal",
    ~examples=`lognormal(0.5, 0.8)
lognormal({p5: 4, p95: 10})
lognormal({mean: 5, stdev: 2})`,
    ~definitions=[
      TwoArgDist.make("lognormal", twoArgs(SymbolicDist.Lognormal.make)),
      TwoArgDist.makeRecordP5P95("lognormal", r =>
        twoArgs(SymbolicDist.Lognormal.from90PercentCI, r)->Ok
      ),
      TwoArgDist.makeRecordMeanStdev("lognormal", twoArgs(SymbolicDist.Lognormal.fromMeanAndStdev)),
    ],
    (),
  ),
  Function.make(
    ~name="Uniform",
    ~examples=`uniform(10, 12)`,
    ~definitions=[TwoArgDist.make("uniform", twoArgs(SymbolicDist.Uniform.make))],
    (),
  ),
  Function.make(
    ~name="Beta",
    ~examples=`beta(20, 25)`,
    ~definitions=[TwoArgDist.make("beta", twoArgs(SymbolicDist.Beta.make))],
    (),
  ),
  Function.make(
    ~name="Cauchy",
    ~examples=`cauchy(5, 1)`,
    ~definitions=[TwoArgDist.make("cauchy", twoArgs(SymbolicDist.Cauchy.make))],
    (),
  ),
  Function.make(
    ~name="Gamma",
    ~examples=`gamma(5, 1)`,
    ~definitions=[TwoArgDist.make("gamma", twoArgs(SymbolicDist.Gamma.make))],
    (),
  ),
  Function.make(
    ~name="Logistic",
    ~examples=`gamma(5, 1)`,
    ~definitions=[TwoArgDist.make("logistic", twoArgs(SymbolicDist.Logistic.make))],
    (),
  ),
  Function.make(
    ~name="To (Distribution)",
    ~examples=`5 to 10
to(5,10)
-5 to 5`,
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
    ~name="Exponential",
    ~examples=`exponential(2)`,
    ~definitions=[OneArgDist.make("exponential", SymbolicDist.Exponential.make)],
    (),
  ),
  Function.make(
    ~name="Bernoulli",
    ~examples=`bernoulli(0.5)`,
    ~definitions=[OneArgDist.make("bernoulli", SymbolicDist.Bernoulli.make)],
    (),
  ),
  Function.make(
    ~name="PointMass",
    ~examples=`pointMass(0.5)`,
    ~definitions=[OneArgDist.make("pointMass", SymbolicDist.Float.makeSafe)],
    (),
  ),
  Function.make(
    ~name="toContinuousPointSet",
    ~description="Converts a set of points to a continuous distribution",
    ~examples=`toContinuousPointSet([
  {x: 0, y: 0.1},
  {x: 1, y: 0.2},
  {x: 2, y: 0.15},
  {x: 3, y: 0.1}
])`,
    ~definitions=[
      FnDefinition.make(
        ~name="toContinuousPointSet",
        ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
        ~run=(inputs, _) => inputsTodist(inputs, r => Continuous(Continuous.make(r))),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="toDiscretePointSet",
    ~description="Converts a set of points to a discrete distribution",
    ~examples=`toDiscretePointSet([
  {x: 0, y: 0.1},
  {x: 1, y: 0.2},
  {x: 2, y: 0.15},
  {x: 3, y: 0.1}
])`,
    ~definitions=[
      FnDefinition.make(
        ~name="toDiscretePointSet",
        ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
        ~run=(inputs, _) => inputsTodist(inputs, r => Discrete(Discrete.make(r))),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Declaration (Continuous Function)",
    ~description="Adds metadata to a function of the input ranges. Works now for numeric and date inputs. This is useful when making predictions. It allows you to limit the domain that your prediction will be used and scored within.",
    ~examples=`declareFn({
  fn: {|a,b| a },
  inputs: [
    {min: 0, max: 100},
    {min: 30, max: 50}
  ]
})`,
    ~definitions=[
      FnDefinition.make(~name="declareFn", ~inputs=[Declaration.frType], ~run=(inputs, _) => {
        inputs->E.A.unsafe_get(0)->Declaration.fromExpressionValue
      }),
    ],
    ~isExperimental=true,
    (),
  ),
  Function.make(
    ~name="Floor",
    ~definitions=[NumberToNumber.make("floor", Js.Math.floor_float)],
    (),
  ),
  Function.make(
    ~name="Ceiling",
    ~definitions=[NumberToNumber.make("ceil", Js.Math.ceil_float)],
    (),
  ),
  Function.make(
    ~name="Absolute Value",
    ~definitions=[NumberToNumber.make("abs", Js.Math.abs_float)],
    (),
  ),
  Function.make(~name="Exponent", ~definitions=[NumberToNumber.make("exp", Js.Math.exp)], ()),
  Function.make(~name="Log", ~definitions=[NumberToNumber.make("log", Js.Math.log)], ()),
  Function.make(
    ~name="Log Base 10",
    ~definitions=[NumberToNumber.make("log10", Js.Math.log10)],
    (),
  ),
  Function.make(~name="Log Base 2", ~definitions=[NumberToNumber.make("log2", Js.Math.log2)], ()),
  Function.make(~name="Round", ~definitions=[NumberToNumber.make("round", Js.Math.round)], ()),
  Function.make(
    ~name="Sum",
    ~definitions=[ArrayNumberDist.make("sum", r => r->E.A.Floats.sum->Wrappers.evNumber->Ok)],
    (),
  ),
  Function.make(
    ~name="Product",
    ~definitions=[
      ArrayNumberDist.make("product", r => r->E.A.Floats.product->Wrappers.evNumber->Ok),
    ],
    (),
  ),
  Function.make(
    ~name="Min",
    ~definitions=[ArrayNumberDist.make("min", r => r->E.A.Floats.min->Wrappers.evNumber->Ok)],
    (),
  ),
  Function.make(
    ~name="Max",
    ~definitions=[ArrayNumberDist.make("max", r => r->E.A.Floats.max->Wrappers.evNumber->Ok)],
    (),
  ),
  Function.make(
    ~name="Mean",
    ~definitions=[ArrayNumberDist.make("mean", r => r->E.A.Floats.mean->Wrappers.evNumber->Ok)],
    (),
  ),
  Function.make(
    ~name="Geometric Mean",
    ~definitions=[
      ArrayNumberDist.make("geomean", r => r->E.A.Floats.geomean->Wrappers.evNumber->Ok),
    ],
    (),
  ),
  Function.make(
    ~name="Standard Deviation",
    ~definitions=[ArrayNumberDist.make("stdev", r => r->E.A.Floats.stdev->Wrappers.evNumber->Ok)],
    (),
  ),
  Function.make(
    ~name="Variance",
    ~definitions=[
      ArrayNumberDist.make("variance", r => r->E.A.Floats.stdev->Wrappers.evNumber->Ok),
    ],
    (),
  ),
  Function.make(
    ~name="First",
    ~definitions=[
      ArrayNumberDist.make2("first", r =>
        r->E.A.first |> E.O.toResult(impossibleError) |> E.R.fmap(Wrappers.evNumber)
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Last",
    ~definitions=[
      ArrayNumberDist.make2("last", r =>
        r->E.A.last |> E.O.toResult(impossibleError) |> E.R.fmap(Wrappers.evNumber)
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Sort",
    ~definitions=[
      ArrayNumberDist.make("sort", r =>
        r->E.A.Floats.sort->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Reverse",
    ~definitions=[
      ArrayNumberDist.make("reverse", r =>
        r->Belt_Array.reverse->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Cumulative Sum",
    ~definitions=[
      ArrayNumberDist.make("cumsum", r =>
        r->E.A.Floats.cumsum->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Cumulative Prod",
    ~definitions=[
      ArrayNumberDist.make("cumprod", r =>
        r->E.A.Floats.cumsum->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Diff",
    ~definitions=[
      ArrayNumberDist.make("diff", r =>
        r->E.A.Floats.diff->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Dict.merge",
    ~definitions=[
      FnDefinition.make(
        ~name="merge",
        ~inputs=[FRTypeDict(FRTypeAny), FRTypeDict(FRTypeAny)],
        ~run=(inputs, _) => {
          switch inputs {
          | [FRValueDict(d1), FRValueDict(d2)] => {
              let newDict =
                E.Dict.concat(d1, d2) |> Js.Dict.map((. r) =>
                  FunctionRegistry_Core.FRType.matchReverse(r)
                )
              newDict->Js.Dict.entries->Belt.Map.String.fromArray->Wrappers.evRecord->Ok
            }
          | _ => Error(impossibleError)
          }
        },
      ),
    ],
    (),
  ),
  //TODO: Make sure that two functions can't have the same name. This causes chaos elsewhere.
  Function.make(
    ~name="Dict.mergeMany",
    ~definitions=[
      FnDefinition.make(~name="mergeMany", ~inputs=[FRTypeArray(FRTypeDict(FRTypeAny))], ~run=(
        inputs,
        _,
      ) =>
        inputs
        ->Prepare.ToTypedArray.dicts
        ->E.R2.fmap(E.Dict.concatMany)
        ->E.R2.fmap(Js.Dict.map((. r) => FunctionRegistry_Core.FRType.matchReverse(r)))
        ->E.R2.fmap(r => r->Js.Dict.entries->Belt.Map.String.fromArray)
        ->E.R2.fmap(Wrappers.evRecord)
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Dict.keys",
    ~definitions=[
      FnDefinition.make(~name="keys", ~inputs=[FRTypeDict(FRTypeAny)], ~run=(inputs, _) =>
        switch inputs {
        | [FRValueDict(d1)] => Js.Dict.keys(d1)->E.A2.fmap(Wrappers.evString)->Wrappers.evArray->Ok
        | _ => Error(impossibleError)
        }
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Dict.values",
    ~definitions=[
      FnDefinition.make(~name="values", ~inputs=[FRTypeDict(FRTypeAny)], ~run=(inputs, _) =>
        switch inputs {
        | [FRValueDict(d1)] =>
          Js.Dict.values(d1)
          ->E.A2.fmap(FunctionRegistry_Core.FRType.matchReverse)
          ->Wrappers.evArray
          ->Ok
        | _ => Error(impossibleError)
        }
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Dict.toList",
    ~definitions=[
      FnDefinition.make(~name="dictToList", ~inputs=[FRTypeDict(FRTypeAny)], ~run=(inputs, _) =>
        switch inputs {
        | [FRValueDict(dict)] =>
          dict
          ->Js.Dict.entries
          ->E.A2.fmap(((key, value)) =>
            Wrappers.evArray([
              Wrappers.evString(key),
              FunctionRegistry_Core.FRType.matchReverse(value),
            ])
          )
          ->Wrappers.evArray
          ->Ok
        | _ => Error(impossibleError)
        }
      ),
    ],
    (),
  ),
  Function.make(
    ~name="Dict.fromList",
    ~definitions=[
      FnDefinition.make(~name="dictFromList", ~inputs=[FRTypeArray(FRTypeArray(FRTypeAny))], ~run=(
        inputs,
        _,
      ) => {
        let convertInternalItems = items =>
          items
          ->E.A2.fmap(item => {
            switch item {
            | [FRValueString(string), value] =>
              (string, FunctionRegistry_Core.FRType.matchReverse(value))->Ok
            | _ => Error(impossibleError)
            }
          })
          ->E.A.R.firstErrorOrOpen
          ->E.R2.fmap(Belt.Map.String.fromArray)
          ->E.R2.fmap(Wrappers.evRecord)
        inputs->getOrError(0)->E.R.bind(Prepare.ToValueArray.Array.arrayOfArrays)
          |> E.R2.bind(convertInternalItems)
      }),
    ],
    (),
  ),
  Function.make(
    ~name="List.make",
    ~definitions=[
      //Todo: If the second item is a function with no args, it could be nice to run this function and return the result.
      FnDefinition.make(~name="listMake", ~inputs=[FRTypeNumber, FRTypeAny], ~run=(inputs, _) => {
        switch inputs {
        | [FRValueNumber(number), value] =>
          Belt.Array.make(E.Float.toInt(number), value)
          ->E.A2.fmap(FunctionRegistry_Core.FRType.matchReverse)
          ->Wrappers.evArray
          ->Ok
        | _ => Error(impossibleError)
        }
      }),
    ],
    (),
  ),
  Function.make(
    ~name="upTo",
    ~definitions=[
      FnDefinition.make(~name="upTo", ~inputs=[FRTypeNumber, FRTypeNumber], ~run=(inputs, _) =>
        inputs
        ->Prepare.ToValueTuple.twoNumbers
        ->E.R2.fmap(((low, high)) =>
          E.A.Floats.range(low, high, (high -. low +. 1.0)->E.Float.toInt)
          ->E.A2.fmap(Wrappers.evNumber)
          ->Wrappers.evArray
        )
      ),
    ],
    (),
  ),
]
