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
        ->E.R2.fmap(args => ReducerInterface_ExpressionValue.EvDeclaration(
          Declaration.make(lambda, args),
        ))
      }
    | Error(r) => Error(r)
    | Ok(_) => Error(FunctionRegistry_Helpers.impossibleError)
    }
  }
}

let inputsTodist = (inputs: array<FunctionRegistry_Core.frValue>, makeDist) => {
  let array = inputs->E.A.unsafe_get(0)->Prepare.ToValueArray.Array.openA
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
    ->E.R2.fmap(r => ReducerInterface_ExpressionValue.EvDistribution(PointSet(makeDist(r))))
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
  ),
  Function.make(
    ~name="Declaration",
    ~definitions=[
      FnDefinition.make(~name="declareFn", ~inputs=[Declaration.frType], ~run=(inputs, _) => {
        inputs->E.A.unsafe_get(0)->Declaration.fromExpressionValue
      }),
    ],
  ),
  Function.make(
    ~name="Normal",
    ~definitions=[
      TwoArgDist.make("normal", twoArgs(SymbolicDist.Normal.make)),
      TwoArgDist.makeRecordP5P95("normal", r =>
        twoArgs(SymbolicDist.Normal.from90PercentCI, r)->Ok
      ),
      TwoArgDist.makeRecordMeanStdev("normal", twoArgs(SymbolicDist.Normal.make)),
    ],
  ),
  Function.make(
    ~name="Lognormal",
    ~definitions=[
      TwoArgDist.make("lognormal", twoArgs(SymbolicDist.Lognormal.make)),
      TwoArgDist.makeRecordP5P95("lognormal", r =>
        twoArgs(SymbolicDist.Lognormal.from90PercentCI, r)->Ok
      ),
      TwoArgDist.makeRecordMeanStdev("lognormal", twoArgs(SymbolicDist.Lognormal.fromMeanAndStdev)),
    ],
  ),
  Function.make(
    ~name="Uniform",
    ~definitions=[TwoArgDist.make("uniform", twoArgs(SymbolicDist.Uniform.make))],
  ),
  Function.make(
    ~name="Beta",
    ~definitions=[TwoArgDist.make("beta", twoArgs(SymbolicDist.Beta.make))],
  ),
  Function.make(
    ~name="Cauchy",
    ~definitions=[TwoArgDist.make("cauchy", twoArgs(SymbolicDist.Cauchy.make))],
  ),
  Function.make(
    ~name="Gamma",
    ~definitions=[TwoArgDist.make("gamma", twoArgs(SymbolicDist.Gamma.make))],
  ),
  Function.make(
    ~name="Logistic",
    ~definitions=[TwoArgDist.make("logistic", twoArgs(SymbolicDist.Logistic.make))],
  ),
  Function.make(
    ~name="To",
    ~definitions=[
      TwoArgDist.make("to", twoArgs(SymbolicDist.From90thPercentile.make)),
      TwoArgDist.make(
        "credibleIntervalToDistribution",
        twoArgs(SymbolicDist.From90thPercentile.make),
      ),
    ],
  ),
  Function.make(
    ~name="Exponential",
    ~definitions=[OneArgDist.make("exponential", SymbolicDist.Exponential.make)],
  ),
  Function.make(
    ~name="Bernoulli",
    ~definitions=[OneArgDist.make("bernoulli", SymbolicDist.Bernoulli.make)],
  ),
  Function.make(
    ~name="Floor",
    ~definitions=[NumberToNumber.make("floor", Js.Math.floor_float)]
  ),
  Function.make(
    ~name="Ceiling",
    ~definitions=[NumberToNumber.make("ceil", Js.Math.ceil_float)]
  ),
  Function.make(
    ~name="Absolute Value",
    ~definitions=[NumberToNumber.make("abs", Js.Math.abs_float)]
  ),
  Function.make(
    ~name="Exponent",
    ~definitions=[NumberToNumber.make("exp", Js.Math.exp)]
  ),
  Function.make(
    ~name="Log",
    ~definitions=[NumberToNumber.make("log", Js.Math.log)]
  ),
  Function.make(
    ~name="Log Base 10",
    ~definitions=[NumberToNumber.make("log10", Js.Math.log10)]
  ),
  Function.make(
    ~name="Log Base 2",
    ~definitions=[NumberToNumber.make("log2", Js.Math.log2)]
  ),
  Function.make(
    ~name="Round",
    ~definitions=[NumberToNumber.make("round", Js.Math.round)]
  ),
  Function.make(
    ~name="Sum",
    ~definitions=[ArrayNumberDist.make("sum", r => r->E.A.Floats.sum->Wrappers.evNumber)],
  ),
  Function.make(
    ~name="Product",
    ~definitions=[ArrayNumberDist.make("product", r => r->E.A.Floats.product->Wrappers.evNumber)],
  ),
  Function.make(
    ~name="Min",
    ~definitions=[ArrayNumberDist.make("min", r => r->E.A.Floats.min->Wrappers.evNumber)],
  ),
  Function.make(
    ~name="Max",
    ~definitions=[ArrayNumberDist.make("max", r => r->E.A.Floats.max->Wrappers.evNumber)],
  ),
  Function.make(
    ~name="Mean",
    ~definitions=[ArrayNumberDist.make("mean", r => r->E.A.Floats.mean->Wrappers.evNumber)],
  ),
  Function.make(
    ~name="Geometric Mean",
    ~definitions=[ArrayNumberDist.make("geomean", r => r->E.A.Floats.geomean->Wrappers.evNumber)],
  ),
  Function.make(
    ~name="Standard Deviation",
    ~definitions=[ArrayNumberDist.make("stdev", r => r->E.A.Floats.stdev->Wrappers.evNumber)],
  ),
  Function.make(
    ~name="Variance",
    ~definitions=[ArrayNumberDist.make("variance", r => r->E.A.Floats.stdev->Wrappers.evNumber)],
  ),
  Function.make(
    ~name="Sort",
    ~definitions=[
      ArrayNumberDist.make("sort", r =>
        r->E.A.Floats.sort->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray
      ),
    ],
  ),
  Function.make(
    ~name="Reverse",
    ~definitions=[
      ArrayNumberDist.make("reverse", r =>
        r->Belt_Array.reverse->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray
      ),
    ],
  ),
]
