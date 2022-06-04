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
    ~name="Normal Distribution",
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
    ~name="Lognormal Distribution",
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
    ~name="Uniform Distribution",
    ~examples=`uniform(10, 12)`,
    ~definitions=[TwoArgDist.make("uniform", twoArgs(SymbolicDist.Uniform.make))],
    (),
  ),
  Function.make(
    ~name="Beta Distribution",
    ~examples=`beta(20, 25)`,
    ~definitions=[TwoArgDist.make("beta", twoArgs(SymbolicDist.Beta.make))],
    (),
  ),
  Function.make(
    ~name="Cauchy Distribution",
    ~examples=`cauchy(5, 1)`,
    ~definitions=[TwoArgDist.make("cauchy", twoArgs(SymbolicDist.Cauchy.make))],
    (),
  ),
  Function.make(
    ~name="Gamma Distribution",
    ~examples=`gamma(5, 1)`,
    ~definitions=[TwoArgDist.make("gamma", twoArgs(SymbolicDist.Gamma.make))],
    (),
  ),
  Function.make(
    ~name="Logistic Distribution",
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
]
