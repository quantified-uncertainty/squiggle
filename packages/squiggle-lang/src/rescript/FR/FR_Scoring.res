open FunctionRegistry_Core

let nameSpace = "Dist"
let requiresNamespace = true

let runScoring = (estimate, answer, prior, env) => {
  GenericDist.Score.logScore(~estimate, ~answer, ~prior, ~env)
  ->E.R.fmap(FunctionRegistry_Helpers.Wrappers.evNumber)
  ->E.R.errMap(e => SqError.Message.REDistributionError(e))
}

let library = [
  Function.make(
    ~name="logScore",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[
      "Dist.logScore({estimate: normal(5,2), answer: normal(5.2,1), prior: normal(5.5,3)})",
      "Dist.logScore({estimate: normal(5,2), answer: normal(5.2,1)})",
      "Dist.logScore({estimate: normal(5,2), answer: 4.5})",
    ],
    ~definitions=[
      FnDefinition.make(
        ~name="logScore",
        ~inputs=[
          FRTypeRecord([
            ("estimate", FRTypeDist),
            ("answer", FRTypeDistOrNumber),
            ("prior", FRTypeDist),
          ]),
        ],
        ~run=(inputs, context, _) => {
          switch FunctionRegistry_Helpers.Prepare.ToValueArray.Record.threeArgs(
            inputs,
            ("estimate", "answer", "prior"),
          ) {
          | Ok([IEvDistribution(estimate), IEvDistribution(d), IEvDistribution(prior)]) =>
            runScoring(estimate, Score_Dist(d), Some(prior), context.environment)
          | Ok([IEvDistribution(estimate), IEvNumber(d), IEvDistribution(prior)]) =>
            runScoring(estimate, Score_Scalar(d), Some(prior), context.environment)
          | Error(e) => Error(e->FunctionRegistry_Helpers.wrapError)
          | _ => Error(FunctionRegistry_Helpers.impossibleError)
          }
        },
        (),
      ),
      FnDefinition.make(
        ~name="logScore",
        ~inputs=[FRTypeRecord([("estimate", FRTypeDist), ("answer", FRTypeDistOrNumber)])],
        ~run=(inputs, context, _) => {
          switch FunctionRegistry_Helpers.Prepare.ToValueArray.Record.twoArgs(
            inputs,
            ("estimate", "answer"),
          ) {
          | Ok([IEvDistribution(estimate), IEvDistribution(d)]) =>
            runScoring(estimate, Score_Dist(d), None, context.environment)
          | Ok([IEvDistribution(estimate), IEvNumber(d)]) =>
            runScoring(estimate, Score_Scalar(d), None, context.environment)
          | Error(e) => Error(e->FunctionRegistry_Helpers.wrapError)
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
    ~output=EvtNumber,
    ~requiresNamespace,
    ~examples=["Dist.klDivergence(normal(5,2), normal(5,1.5))"],
    ~definitions=[
      FnDefinition.make(
        ~name="klDivergence",
        ~inputs=[FRTypeDist, FRTypeDist],
        ~run=(inputs, context, _) => {
          switch inputs {
          | [IEvDistribution(estimate), IEvDistribution(d)] =>
            runScoring(estimate, Score_Dist(d), None, context.environment)
          | _ => Error(FunctionRegistry_Helpers.impossibleError)
          }
        },
        (),
      ),
    ],
    (),
  ),
]
