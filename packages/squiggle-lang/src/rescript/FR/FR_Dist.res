open FunctionRegistry_Core
open FunctionRegistry_Helpers
let twoArgs = E.Tuple2.toFnCall

module DistributionCreation = {
  let nameSpace = "Dist"
  let output = Reducer_Value.EvtDistribution
  let requiresNamespace = false

  let fnMake = (~name, ~examples, ~definitions) => {
    Function.make(~name, ~nameSpace, ~output, ~examples, ~definitions, ~requiresNamespace, ())
  }

  module TwoArgDist = {
    let process = (~fn, ~env, r) =>
      r
      ->E.R.bind(Process.DistOrNumberToDist.twoValuesUsingSymbolicDist(~fn, ~values=_, ~env))
      ->E.R.fmap(Wrappers.evDistribution)
      ->E.R.errMap(e => SqError.Message.REOther(e))

    let make = (name, fn) => {
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeDistOrNumber, FRTypeDistOrNumber],
        ~run=(inputs, context, _) =>
          inputs->Prepare.ToValueTuple.twoDistOrNumber->process(~fn, ~env=context.environment),
        (),
      )
    }

    let makeRecordP5P95 = (name, fn) => {
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeRecord([("p5", FRTypeDistOrNumber), ("p95", FRTypeDistOrNumber)])],
        ~run=(inputs, context, _) =>
          inputs
          ->Prepare.ToValueTuple.Record.twoDistOrNumber(("p5", "p95"))
          ->process(~fn, ~env=context.environment),
        (),
      )
    }

    let makeRecordMeanStdev = (name, fn) => {
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeRecord([("mean", FRTypeDistOrNumber), ("stdev", FRTypeDistOrNumber)])],
        ~run=(inputs, context, _) =>
          inputs
          ->Prepare.ToValueTuple.Record.twoDistOrNumber(("mean", "stdev"))
          ->process(~fn, ~env=context.environment),
        (),
      )
    }
  }

  module OneArgDist = {
    let process = (~fn, ~env, r) =>
      r
      ->E.R.bind(Process.DistOrNumberToDist.oneValueUsingSymbolicDist(~fn, ~value=_, ~env))
      ->E.R.fmap(Wrappers.evDistribution)
      ->E.R.errMap(e => SqError.Message.REOther(e))

    let make = (name, fn) =>
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeDistOrNumber],
        ~run=(inputs, context, _) =>
          inputs->Prepare.ToValueTuple.oneDistOrNumber->process(~fn, ~env=context.environment),
        (),
      )
  }

  let library = [
    fnMake(
      ~name="normal",
      ~examples=["normal(5,1)", "normal({p5: 4, p95: 10})", "normal({mean: 5, stdev: 2})"],
      ~definitions=[
        TwoArgDist.make("normal", twoArgs(SymbolicDist.Normal.make)),
        TwoArgDist.makeRecordP5P95("normal", r =>
          twoArgs(SymbolicDist.Normal.from90PercentCI, r)->Ok
        ),
        TwoArgDist.makeRecordMeanStdev("normal", twoArgs(SymbolicDist.Normal.make)),
      ],
    ),
    fnMake(
      ~name="lognormal",
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
    ),
    fnMake(
      ~name="uniform",
      ~examples=[`uniform(10, 12)`],
      ~definitions=[TwoArgDist.make("uniform", twoArgs(SymbolicDist.Uniform.make))],
    ),
    fnMake(
      ~name="beta",
      ~examples=[`beta(20, 25)`, `beta({mean: 0.39, stdev: 0.1})`],
      ~definitions=[
        TwoArgDist.make("beta", twoArgs(SymbolicDist.Beta.make)),
        TwoArgDist.makeRecordMeanStdev("beta", twoArgs(SymbolicDist.Beta.fromMeanAndStdev)),
      ],
    ),
    fnMake(
      ~name="cauchy",
      ~examples=[`cauchy(5, 1)`],
      ~definitions=[TwoArgDist.make("cauchy", twoArgs(SymbolicDist.Cauchy.make))],
    ),
    fnMake(
      ~name="gamma",
      ~examples=[`gamma(5, 1)`],
      ~definitions=[TwoArgDist.make("gamma", twoArgs(SymbolicDist.Gamma.make))],
    ),
    fnMake(
      ~name="logistic",
      ~examples=[`logistic(5, 1)`],
      ~definitions=[TwoArgDist.make("logistic", twoArgs(SymbolicDist.Logistic.make))],
    ),
    fnMake(
      ~name="to (distribution)",
      ~examples=[`5 to 10`, `to(5,10)`, `-5 to 5`],
      ~definitions=[
        TwoArgDist.make("to", twoArgs(SymbolicDist.From90thPercentile.make)),
        TwoArgDist.make(
          "credibleIntervalToDistribution",
          twoArgs(SymbolicDist.From90thPercentile.make),
        ),
      ],
    ),
    fnMake(
      ~name="exponential",
      ~examples=[`exponential(2)`],
      ~definitions=[OneArgDist.make("exponential", SymbolicDist.Exponential.make)],
    ),
    fnMake(
      ~name="bernoulli",
      ~examples=[`bernoulli(0.5)`],
      ~definitions=[OneArgDist.make("bernoulli", SymbolicDist.Bernoulli.make)],
    ),
    fnMake(
      ~name="pointMass",
      ~examples=[`pointMass(0.5)`],
      ~definitions=[OneArgDist.make("pointMass", SymbolicDist.Float.makeSafe)],
    ),
  ]
}

let library = DistributionCreation.library
