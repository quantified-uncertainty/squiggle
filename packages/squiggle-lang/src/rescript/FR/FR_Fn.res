open FunctionRegistry_Core
open FunctionRegistry_Helpers

module Declaration = {
  let frType = FRTypeRecord([
    ("fn", FRTypeLambda),
    ("inputs", FRTypeArray(FRTypeRecord([("min", FRTypeNumber), ("max", FRTypeNumber)]))),
  ])

  let fromExpressionValue = (e: Reducer_T.value): result<Reducer_T.value, string> => {
    switch FunctionRegistry_Helpers.Prepare.ToValueArray.Record.twoArgs([e], ("fn", "inputs")) {
    | Ok([IEvLambda(lambda), IEvArray(inputs)]) => {
        open FunctionRegistry_Helpers.Prepare
        let getMinMax = arg =>
          ToValueArray.Record.twoArgs([arg], ("min", "max"))
          ->E.R.bind(ToValueTuple.twoNumbers)
          ->E.R.fmap(((min, max)) => Declaration.ContinuousFloatArg.make(min, max))
        inputs
        ->E.A.fmap(getMinMax)
        ->E.A.R.firstErrorOrOpen
        ->E.R.fmap(args => Reducer_T.IEvDeclaration(Declaration.make(lambda, args)))
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
        ~run=(inputs, _, _) => {
          inputs->getOrError(0)->E.R.bind(Declaration.fromExpressionValue)->E.R.errMap(wrapError)
        },
        (),
      ),
    ],
    (),
  ),
]
