open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "SampleSet"
let requiresNamespace = true

module Internal = {
  type t = SampleSetDist.t
  let doLambdaCall = (aLambdaValue, list, environment, reducer) =>
    switch Reducer_Expression_Lambda.doLambdaCall(aLambdaValue, list, environment, reducer) {
    | Ok(IEvNumber(f)) => Ok(f)
    | _ => Error(Operation.SampleMapNeedsNtoNFunction)
    }

  let toType = (r): result<
    ReducerInterface_InternalExpressionValue.t,
    Reducer_ErrorValue.errorValue,
  > =>
    switch r {
    | Ok(r) => Ok(Wrappers.evDistribution(SampleSet(r)))
    | Error(r) => Error(REDistributionError(SampleSetError(r)))
    }

  let map1 = (sampleSetDist: t, aLambdaValue, env, reducer) => {
    let fn = r => doLambdaCall(aLambdaValue, list{IEvNumber(r)}, env, reducer)
    SampleSetDist.samplesMap(~fn, sampleSetDist)->toType
  }

  let map2 = (t1: t, t2: t, aLambdaValue, env, reducer) => {
    let fn = (a, b) => doLambdaCall(aLambdaValue, list{IEvNumber(a), IEvNumber(b)}, env, reducer)
    SampleSetDist.map2(~fn, ~t1, ~t2)->toType
  }

  let map3 = (t1: t, t2: t, t3: t, aLambdaValue, env, reducer) => {
    let fn = (a, b, c) =>
      doLambdaCall(aLambdaValue, list{IEvNumber(a), IEvNumber(b), IEvNumber(c)}, env, reducer)
    SampleSetDist.map3(~fn, ~t1, ~t2, ~t3)->toType
  }

  let parseSampleSetArray = (arr: array<internalExpressionValue>): option<
    array<SampleSetDist.t>,
  > => {
    let parseSampleSet = (value: internalExpressionValue): option<SampleSetDist.t> =>
      switch value {
      | IEvDistribution(SampleSet(dist)) => Some(dist)
      | _ => None
      }
    E.A.O.openIfAllSome(E.A.fmap(parseSampleSet, arr))
  }

  let mapN = (aValueArray: array<internalExpressionValue>, aLambdaValue, env, reducer) => {
    switch parseSampleSetArray(aValueArray) {
    | Some(t1) =>
      let fn = a =>
        doLambdaCall(
          aLambdaValue,
          list{IEvArray(E.A.fmap(x => Wrappers.evNumber(x), a))},
          env,
          reducer,
        )
      SampleSetDist.mapN(~fn, ~t1)->toType
    | None => Error(REFunctionNotFound(""))
    }
  }
}

let library = [
  Function.make(
    ~name="fromDist",
    ~nameSpace,
    ~requiresNamespace=true,
    ~examples=[`SampleSet.fromDist(normal(5,2))`],
    ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="fromDist",
        ~inputs=[FRTypeDist],
        ~run=(_, inputs, env, _) =>
          switch inputs {
          | [FRValueDist(dist)] =>
            GenericDist.toSampleSetDist(dist, env.sampleCount)
            ->E.R2.fmap(Wrappers.sampleSet)
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
    ~name="fromList",
    ~nameSpace,
    ~requiresNamespace=true,
    ~examples=[`SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5,3,2,3,1,1,3])`],
    ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="fromList",
        ~inputs=[FRTypeArray(FRTypeNumber)],
        ~run=(_, inputs, _, _) => {
          let sampleSet =
            Prepare.ToTypedArray.numbers(inputs) |> E.R2.bind(r =>
              SampleSetDist.make(r)->E.R2.errMap(_ => "AM I HERE? WHYERE AMI??")
            )
          sampleSet->E.R2.fmap(Wrappers.sampleSet)->E.R2.fmap(Wrappers.evDistribution)
        },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="toList",
    ~nameSpace,
    ~requiresNamespace=false,
    ~examples=[`SampleSet.toList(SampleSet.fromDist(normal(5,2)))`],
    ~output=ReducerInterface_InternalExpressionValue.EvtArray,
    ~definitions=[
      FnDefinition.make(
        ~name="toList",
        ~inputs=[FRTypeDist],
        ~run=(inputs, _, _, _) =>
          switch inputs {
          | [IEvDistribution(SampleSet(dist))] =>
            dist->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="map",
    ~nameSpace,
    ~requiresNamespace,
    ~examples=[`SampleSet.map(SampleSet.fromDist(normal(5,2)), {|x| x + 1})`],
    ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="map",
        ~inputs=[FRTypeDist, FRTypeLambda],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [IEvDistribution(SampleSet(dist)), IEvLambda(lambda)] =>
            Internal.map1(dist, lambda, env, reducer)->E.R2.errMap(_ => "")
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="map2",
    ~nameSpace,
    ~requiresNamespace,
    ~examples=[
      `SampleSet.map2(SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), {|x, y| x + y})`,
    ],
    ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="map2",
        ~inputs=[FRTypeDist, FRTypeDist, FRTypeLambda],
        ~run=(inputs, _, env, reducer) => {
          switch inputs {
          | [
              IEvDistribution(SampleSet(dist1)),
              IEvDistribution(SampleSet(dist2)),
              IEvLambda(lambda),
            ] =>
            Internal.map2(dist1, dist2, lambda, env, reducer)->E.R2.errMap(_ => "")
          | _ => Error(impossibleError)
          }
        },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="map3",
    ~nameSpace,
    ~requiresNamespace,
    ~examples=[
      `SampleSet.map3(SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), {|x, y, z| max([x,y,z])})`,
    ],
    ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="map3",
        ~inputs=[FRTypeDist, FRTypeDist, FRTypeDist, FRTypeLambda],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [
              IEvDistribution(SampleSet(dist1)),
              IEvDistribution(SampleSet(dist2)),
              IEvDistribution(SampleSet(dist3)),
              IEvLambda(lambda),
            ] =>
            Internal.map3(dist1, dist2, dist3, lambda, env, reducer)->E.R2.errMap(_ => "")
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="mapN",
    ~nameSpace,
    ~requiresNamespace,
    ~examples=[
      `SampleSet.mapN([SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2))], {|x| max(x)})`,
    ],
    ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="mapN",
        ~inputs=[FRTypeArray(FRTypeDist), FRTypeLambda],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [IEvArray(dists), IEvLambda(lambda)] =>
            Internal.mapN(dists, lambda, env, reducer)->E.R2.errMap(e => {
              "AHHH doesn't work"
            })
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
]
