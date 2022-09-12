open FunctionRegistry_Core
open FunctionRegistry_Helpers

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
        ->E.R2.fmap(args => Reducer_T.IEvDeclaration(Declaration.make(lambda, args)))
      }
    | Error(r) => Error(r)
    | Ok(_) => Error(impossibleErrorString)
    }
  }
}

let nameSpace = "Function"

let library = [
  Function.make(
    ~name="declare",
    ~nameSpace,
    ~requiresNamespace=true,
    ~output=EvtDeclaration,
    ~description="Adds metadata to a function of the input ranges. Works now for numeric and date inputs. This is useful when making predictions. It allows you to limit the domain that your prediction will be used and scored within.",
    ~examples=[
      `Function.declare({
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
        ~name="declare",
        ~inputs=[Declaration.frType],
        ~run=(_, inputs, _, _) => {
          inputs->getOrError(0)->E.R.bind(Declaration.fromExpressionValue)->E.R2.errMap(wrapError)
        },
        (),
      ),
    ],
    (),
  ),
]
