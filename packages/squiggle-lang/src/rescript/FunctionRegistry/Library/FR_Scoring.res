open FunctionRegistry_Core

let nameSpace = "Dist"
let requiresNamespace = true

let runScoring = (estimate, answer, prior, env) => {
  GenericDist.Score.logScore(~estimate, ~answer, ~prior, ~env)
  ->E.R2.fmap(FunctionRegistry_Helpers.Wrappers.evNumber)
  ->E.R2.errMap(DistributionTypes.Error.toString)
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
        ~run=(_, inputs, environment, _) => {
          switch FunctionRegistry_Helpers.Prepare.ToValueArray.Record.threeArgs(inputs) {
          | Ok([FRValueDist(estimate), FRValueDistOrNumber(FRValueDist(d)), FRValueDist(prior)]) =>
            runScoring(estimate, Score_Dist(d), Some(prior), environment)
          | Ok([
              FRValueDist(estimate),
              FRValueDistOrNumber(FRValueNumber(d)),
              FRValueDist(prior),
            ]) =>
            runScoring(estimate, Score_Scalar(d), Some(prior), environment)
          | Error(e) => Error(e)
          | _ => Error(FunctionRegistry_Helpers.impossibleError)
          }
        },
        (),
      ),
      FnDefinition.make(
        ~name="logScore",
        ~inputs=[FRTypeRecord([("estimate", FRTypeDist), ("answer", FRTypeDistOrNumber)])],
        ~run=(_, inputs, environment, _) => {
          switch FunctionRegistry_Helpers.Prepare.ToValueArray.Record.twoArgs(inputs) {
          | Ok([FRValueDist(estimate), FRValueDistOrNumber(FRValueDist(d))]) =>
            runScoring(estimate, Score_Dist(d), None, environment)
          | Ok([FRValueDist(estimate), FRValueDistOrNumber(FRValueNumber(d))]) =>
            runScoring(estimate, Score_Scalar(d), None, environment)
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
    ~output=EvtNumber,
    ~requiresNamespace,
    ~examples=["Dist.klDivergence(normal(5,2), normal(5,1.5))"],
    ~definitions=[
      FnDefinition.make(
        ~name="klDivergence",
        ~inputs=[FRTypeDist, FRTypeDist],
        ~run=(_, inputs, environment, _) => {
          switch inputs {
          | [FRValueDist(estimate), FRValueDist(d)] =>
            runScoring(estimate, Score_Dist(d), None, environment)
          | _ => Error(FunctionRegistry_Helpers.impossibleError)
          }
        },
        (),
      ),
    ],
    (),
  ),
]
