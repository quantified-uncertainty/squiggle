open FunctionRegistry_Core
open FunctionRegistry_Helpers

let twoArgs = E.Tuple2.toFnCall

// ~run=(inputs, env) => switch(inputs->FunctionRegistry_Helpers.Prepare.ToValueArray.Record.twoArgs){
//   | (FRTypeArray(records), FRValueLambdaValue(fn)) => {
//     records->E.A.fmap2(r => r->FunctionRegistry_Helpers.Prepare.ToValueArray.Record.twoArgs->FunctionRegistry_Helpers.Prepare)
//     })
//   }
// let variant = FRTypeVariant(["Numeric", "Date"])
let recordType = FRTypeRecord([("min", FRTypeNumber), ("max", FRTypeNumber)])
let registry = [
  Function.make(
    ~name="FnMake",
    ~definitions=[
      FnDefinition.make(
        ~name="declareFn",
        ~inputs=[FRTypeRecord([("inputs", FRTypeArray(recordType))])],
        ~run=(inputs, _) => {
          let foo = FunctionRegistry_Core.FRType.matchReverse(inputs->E.A.unsafe_get(0))
          foo->Ok
        }
      ),
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
