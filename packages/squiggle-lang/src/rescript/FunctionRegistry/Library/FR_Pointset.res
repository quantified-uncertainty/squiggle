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

module Internal = {
  type t = PointSetDist.t

  let toType = (r): result<
    ReducerInterface_InternalExpressionValue.t,
    Reducer_ErrorValue.errorValue,
  > =>
    switch r {
    | Ok(r) => Ok(Wrappers.evDistribution(PointSet(r)))
    | Error(err) => Error(REOperationError(err))
    }

  let doLambdaCall = (aLambdaValue, list, environment, reducer) =>
    switch Reducer_Expression_Lambda.doLambdaCall(aLambdaValue, list, environment, reducer) {
    | IEvNumber(f) => Ok(f)
    | _ => Error(Operation.SampleMapNeedsNtoNFunction)
    }

  let mapY = (pointSetDist: t, aLambdaValue, env, reducer) => {
    let fn = r => doLambdaCall(aLambdaValue, list{IEvNumber(r)}, env, reducer)
    PointSetDist.T.mapYResult(~fn, pointSetDist)->toType
  }
}

let library = [
  Function.make(
    ~name="fromDist",
    ~nameSpace,
    ~requiresNamespace=true,
    ~examples=[`PointSet.fromDist(normal(5,2))`],
    ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="fromDist",
        ~inputs=[FRTypeDist],
        ~run=(_, inputs, accessors, _) =>
          switch inputs {
          | [FRValueDist(dist)] =>
            GenericDist.toPointSet(
              dist,
              ~xyPointLength=accessors.environment.xyPointLength,
              ~sampleCount=accessors.environment.sampleCount,
              (),
            )
            ->E.R2.fmap(Wrappers.pointSet)
            ->E.R2.fmap(Wrappers.evDistribution)
            ->E.R2.errMap(_ => "")
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="mapY",
    ~nameSpace,
    ~requiresNamespace=true,
    ~examples=[`PointSet.mapY(mx(normal(5,2)), {|x| x + 1})`],
    ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="mapY",
        ~inputs=[FRTypeDist, FRTypeLambda],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [IEvDistribution(PointSet(dist)), IEvLambda(lambda)] =>
            Internal.mapY(dist, lambda, env, reducer)->E.R2.errMap(Reducer_ErrorValue.errorToString)
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="makeContinuous",
    ~nameSpace,
    ~requiresNamespace,
    ~examples=[
      `PointSet.makeContinuous([
        {x: 0, y: 0.2},
        {x: 1, y: 0.7},
        {x: 2, y: 0.8},
        {x: 3, y: 0.2}
      ])`,
    ],
    ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="makeContinuous",
        ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
        ~run=(_, inputs, _, _) => inputsTodist(inputs, r => Continuous(Continuous.make(r))),
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="makeDiscrete",
    ~nameSpace,
    ~requiresNamespace,
    ~examples=[
      `PointSet.makeDiscrete([
        {x: 0, y: 0.2},
        {x: 1, y: 0.7},
        {x: 2, y: 0.8},
        {x: 3, y: 0.2}
      ])`,
    ],
    ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="makeDiscrete",
        ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
        ~run=(_, inputs, _, _) => inputsTodist(inputs, r => Discrete(Discrete.make(r))),
        (),
      ),
    ],
    (),
  ),
]
