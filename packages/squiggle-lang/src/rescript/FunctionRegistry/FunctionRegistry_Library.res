open FunctionRegistry_Core
open FunctionRegistry_Helpers

let twoArgs = E.Tuple2.toFnCall

module FnDeclaration = {
  type range = {min: float, max: float}
  let makeRange = (min, max) => {min: min, max: max}
  type t = {
    fn: ReducerInterface_ExpressionValue.lambdaValue,
    args: array<range>,
  }

  let validate = (def: t) => {
    let {parameters, _} = def.fn
    E.A.length(parameters) == E.A.length(def.args)
  }

  let frType = FRTypeRecord([
    ("fn", FRTypeLambda),
    ("inputs", FRTypeArray(FRTypeRecord([("min", FRTypeNumber), ("max", FRTypeNumber)]))),
  ])

  let fromExpressionValue = (e: expressionValue) => {
    let values = FunctionRegistry_Core.FRType.matchWithExpressionValue(frType, e)
    switch values->E.O2.fmap(r =>
      FunctionRegistry_Helpers.Prepare.ToValueArray.Record.twoArgs([r])
    ) {
    | Some(Ok([FRValueLambda(lambda), FRValueArray(inputs)])) => {
        open FunctionRegistry_Helpers.Prepare
        let getMinMax = arg => 
          ToValueArray.Record.toArgs([arg])
          ->E.R.bind(ToValueTuple.twoNumbers)
          ->E.R2.fmap(((min, max)) => makeRange(min, max))
        inputs
        ->E.A2.fmap(getMinMax)
        ->E.A.R.firstErrorOrOpen
        ->E.R2.fmap(args => {fn: lambda, args: args})
      }
    | _ => Error("Error")
    }
  }
}

let registry = [
  Function.make(
    ~name="FnMake",
    ~definitions=[
      FnDefinition.make(~name="declareFn", ~inputs=[FnDeclaration.frType], ~run=(inputs, _) => {
        let result = inputs->E.A.unsafe_get(0)->FunctionRegistry_Core.FRType.matchReverse->Ok
        let foo = result->E.R2.fmap(FnDeclaration.fromExpressionValue)
        Js.log2("HIHIHI", foo)
        result
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
]
