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
        ~run=(_, inputs, env, _) => {
          switch FunctionRegistry_Helpers.Prepare.ToValueArray.Record.threeArgs(inputs) {
          | Ok([FRValueDist(estimate), FRValueDistOrNumber(FRValueDist(d)), FRValueDist(prior)]) =>
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
        ~inputs=[FRTypeRecord([("estimate", FRTypeDist), ("answer", FRTypeDistOrNumber)])],
        ~run=(_, inputs, env, _) => {
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
    ~output=EvtNumber,
    ~requiresNamespace,
    ~examples=["Dist.klDivergence(normal(5,2), normal(5,1.5))"],
    ~definitions=[
      FnDefinition.make(
        ~name="klDivergence",
        ~inputs=[FRTypeDist, FRTypeDist],
        ~run=(_, inputs, env, _) => {
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
