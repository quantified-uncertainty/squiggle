open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "PointSet"
let requiresNamespace = true

let inputsToDist = (inputs: array<Reducer_T.value>, xyShapeToPointSetDist) => {
  // TODO - rewrite in more functional/functor-based style
  switch inputs {
  | [IEvArray(items)] =>
    items
    ->E.A.fmap(item =>
      switch item {
      | IEvRecord(map) => {
          let xValue = map->Belt.Map.String.get("x")
          let yValue = map->Belt.Map.String.get("y")
          switch (xValue, yValue) {
          | (Some(IEvNumber(x)), Some(IEvNumber(y))) => (x, y)
          | _ => impossibleError->SqError.Message.throw
          }
        }

      | _ => impossibleError->SqError.Message.throw
      }
    )
    ->Ok
    ->E.R.bind(r => r->XYShape.T.makeFromZipped->E.R.errMap(XYShape.Error.toString))
    ->E.R.fmap(r => Reducer_T.IEvDistribution(PointSet(r->xyShapeToPointSetDist)))
  | _ => impossibleError->SqError.Message.throw
  }
}

module Internal = {
  type t = PointSetDist.t

  let toType = (r): result<Reducer_T.value, SqError.Message.t> =>
    switch r {
    | Ok(r) => Ok(Wrappers.evDistribution(PointSet(r)))
    | Error(err) => Error(REOperationError(err))
    }

  let doLambdaCall = (aLambdaValue, list, context, reducer) =>
    switch Reducer_Lambda.doLambdaCall(aLambdaValue, list, context, reducer) {
    | Reducer_T.IEvNumber(f) => Ok(f)
    | _ => Error(Operation.SampleMapNeedsNtoNFunction)
    }

  let mapY = (pointSetDist: t, aLambdaValue, context, reducer) => {
    let fn = r => doLambdaCall(aLambdaValue, [IEvNumber(r)], context, reducer)
    pointSetDist->PointSetDist.T.mapYResult(fn)->toType
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
        ~run=(inputs, context, _) =>
          switch inputs {
          | [IEvDistribution(dist)] =>
            GenericDist.toPointSet(
              dist,
              ~xyPointLength=context.environment.xyPointLength,
              ~sampleCount=context.environment.sampleCount,
              (),
            )
            ->E.R.fmap(Wrappers.pointSet)
            ->E.R.fmap(Wrappers.evDistribution)
            ->E.R.errMap(e => SqError.Message.REDistributionError(e))
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
        ~run=(inputs, context, reducer) =>
          switch inputs {
          | [IEvDistribution(PointSet(dist)), IEvLambda(lambda)] =>
            Internal.mapY(dist, lambda, context, reducer)
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
          inputsToDist(inputs, r => Continuous(Continuous.make(r)))->E.R.errMap(wrapError),
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
          inputsToDist(inputs, r => Discrete(Discrete.make(r)))->E.R.errMap(wrapError),
        (),
      ),
    ],
    (),
  ),
]
