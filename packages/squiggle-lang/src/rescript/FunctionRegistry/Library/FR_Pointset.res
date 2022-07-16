open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "PointSet"
let requiresNamespace = true

let inputsTodist = (inputs: array<FunctionRegistry_Core.frValue>, makeDist) => {
  let array = inputs->getOrError(0)->E.R.bind(Prepare.ToValueArray.Array.openA)
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
    ->E.R2.fmap(r => ReducerInterface_InternalExpressionValue.IEvDistribution(
      PointSet(makeDist(r)),
    ))
  expressionValue
}

let library = [
  Function.make(
    ~name="makeContinuous",
    ~nameSpace,
    ~definitions=[
      FnDefinition.make(
        ~requiresNamespace,
        ~name="makeContinuous",
        ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
        ~run=(_, inputs, _) => inputsTodist(inputs, r => Continuous(Continuous.make(r))),
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="makeDiscrete",
    ~nameSpace,
    ~definitions=[
      FnDefinition.make(
        ~requiresNamespace,
        ~name="makeDiscrete",
        ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
        ~run=(_, inputs, _) => inputsTodist(inputs, r => Discrete(Discrete.make(r))),
        (),
      ),
    ],
    (),
  ),
]
