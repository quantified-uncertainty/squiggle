open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "PointSet"
let requiresNamespace = true

let inputsToDist = (inputs: array<Reducer_T.value>, xyShapeToPointSetDist) => {
  // TODO - rewrite in more functional/functor-based style
  switch inputs {
  | [IEvArray(items)] => items
    ->Belt.Array.map(item =>
      switch item {
      | IEvRecord(map) => {
          let xValue = map->Belt.Map.String.get("x")
          let yValue = map->Belt.Map.String.get("y")
          switch (xValue, yValue) {
          | (Some(IEvNumber(x)), Some(IEvNumber(y))) => (x, y)
          | _ => impossibleError->Reducer_ErrorValue.toException
          }
        }
      | _ => impossibleError->Reducer_ErrorValue.toException
      }
    )
    ->Ok
    ->E.R.bind(r => r->XYShape.T.makeFromZipped->E.R2.errMap(XYShape.Error.toString))
    ->E.R2.fmap(r => Reducer_T.IEvDistribution(PointSet(r->xyShapeToPointSetDist)))
  | _ => impossibleError->Reducer_ErrorValue.toException
  }
}

module Internal = {
  type t = PointSetDist.t

  let toType = (r): result<Reducer_T.value, Reducer_ErrorValue.errorValue> =>
    switch r {
    | Ok(r) => Ok(Wrappers.evDistribution(PointSet(r)))
    | Error(err) => Error(REOperationError(err))
    }

  let doLambdaCall = (aLambdaValue, list, env, reducer) =>
    switch Reducer_Expression_Lambda.doLambdaCall(aLambdaValue, list, env, reducer) {
    | Reducer_T.IEvNumber(f) => Ok(f)
    | _ => Error(Operation.SampleMapNeedsNtoNFunction)
    }

  let mapY = (pointSetDist: t, aLambdaValue, env, reducer) => {
    let fn = r => doLambdaCall(aLambdaValue, [IEvNumber(r)], env, reducer)
    PointSetDist.T.mapYResult(~fn, pointSetDist)->toType
  }
}

let library = [
  Function.make(
    ~name="fromDist",
    ~nameSpace,
    ~requiresNamespace=true,
    ~examples=[`PointSet.fromDist(normal(5,2))`],
    ~output=Reducer_Value.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="fromDist",
        ~inputs=[FRTypeDist],
        ~run=(inputs, env, _) =>
          switch inputs {
          | [IEvDistribution(dist)] =>
            GenericDist.toPointSet(
              dist,
              ~xyPointLength=env.xyPointLength,
              ~sampleCount=env.sampleCount,
              (),
            )
            ->E.R2.fmap(Wrappers.pointSet)
            ->E.R2.fmap(Wrappers.evDistribution)
            ->E.R2.errMap(e => Reducer_ErrorValue.REDistributionError(e))
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
    ~output=Reducer_Value.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="mapY",
        ~inputs=[FRTypeDist, FRTypeLambda],
        ~run=(inputs, env, reducer) =>
          switch inputs {
          | [IEvDistribution(PointSet(dist)), IEvLambda(lambda)] =>
            Internal.mapY(dist, lambda, env, reducer)
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
    ~output=Reducer_Value.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="makeContinuous",
        ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
        ~run=(inputs, _, _) =>
          inputsToDist(inputs, r => Continuous(Continuous.make(r)))->E.R2.errMap(wrapError),
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
    ~output=Reducer_Value.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="makeDiscrete",
        ~inputs=[FRTypeArray(FRTypeRecord([("x", FRTypeNumeric), ("y", FRTypeNumeric)]))],
        ~run=(inputs, _, _) =>
          inputsToDist(inputs, r => Discrete(Discrete.make(r)))->E.R2.errMap(wrapError),
        (),
      ),
    ],
    (),
  ),
]
