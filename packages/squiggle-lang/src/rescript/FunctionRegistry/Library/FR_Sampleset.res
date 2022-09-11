// module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
// module ProjectReducerFnT = ReducerProject_ReducerFn_T
open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "SampleSet"
let requiresNamespace = true

module Internal = {
  type t = SampleSetDist.t

  let doLambdaCall = (
    aLambdaValue,
    list,
    accessors: ProjectAccessorsT.t,
    reducer: ProjectReducerFnT.t,
  ) =>
    switch Reducer_Expression_Lambda.doLambdaCall(aLambdaValue, list, accessors, reducer) {
    | IEvNumber(f) => Ok(f)
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

  //TODO: I don't know why this seems to need at least one input
  let fromFn = (aLambdaValue, accessors: ProjectAccessorsT.t, reducer: ProjectReducerFnT.t) => {
    let sampleCount = accessors.environment.sampleCount
    let fn = r => doLambdaCall(aLambdaValue, list{IEvNumber(r)}, accessors, reducer)
    Belt_Array.makeBy(sampleCount, r => fn(r->Js.Int.toFloat))->E.A.R.firstErrorOrOpen
  }

  let map1 = (sampleSetDist: t, aLambdaValue, accessors: ProjectAccessorsT.t, reducer) => {
    let fn = r => doLambdaCall(aLambdaValue, list{IEvNumber(r)}, accessors, reducer)
    SampleSetDist.samplesMap(~fn, sampleSetDist)->toType
  }

  let map2 = (t1: t, t2: t, aLambdaValue, accessors: ProjectAccessorsT.t, reducer) => {
    let fn = (a, b) =>
      doLambdaCall(aLambdaValue, list{IEvNumber(a), IEvNumber(b)}, accessors, reducer)
    SampleSetDist.map2(~fn, ~t1, ~t2)->toType
  }

  let map3 = (t1: t, t2: t, t3: t, aLambdaValue, accessors: ProjectAccessorsT.t, reducer) => {
    let fn = (a, b, c) =>
      doLambdaCall(aLambdaValue, list{IEvNumber(a), IEvNumber(b), IEvNumber(c)}, accessors, reducer)
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

  let mapN = (
    aValueArray: array<internalExpressionValue>,
    aLambdaValue,
    accessors: ProjectAccessorsT.t,
    reducer,
  ) => {
    switch parseSampleSetArray(aValueArray) {
    | Some(t1) =>
      let fn = a =>
        doLambdaCall(
          aLambdaValue,
          list{IEvArray(E.A.fmap(x => Wrappers.evNumber(x), a))},
          accessors,
          reducer,
        )
      SampleSetDist.mapN(~fn, ~t1)->toType
    | None => Error(REFunctionNotFound(""))
    }
  }
}

let libaryBase = [
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
        ~run=(_, inputs, accessors: ProjectAccessorsT.t, _) =>
          switch inputs {
          | [FRValueDist(dist)] =>
            GenericDist.toSampleSetDist(dist, accessors.environment.sampleCount)
            ->E.R2.fmap(Wrappers.sampleSet)
            ->E.R2.fmap(Wrappers.evDistribution)
            ->E.R2.errMap(DistributionTypes.Error.toString)
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
    ~requiresNamespace=true,
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
    ~name="fromFn",
    ~nameSpace,
    ~requiresNamespace=true,
    ~examples=[`SampleSet.fromFn({|| sample(normal(5,2))})`],
    ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="fromFn",
        ~inputs=[FRTypeLambda],
        ~run=(inputs, _, accessors: ProjectAccessorsT.t, reducer: ProjectReducerFnT.t) =>
          switch inputs {
          | [IEvLambda(lambda)] =>
            switch Internal.fromFn(lambda, accessors, reducer) {
            | Ok(r) => Ok(r->Wrappers.sampleSet->Wrappers.evDistribution)
            | Error(e) => Error(Operation.Error.toString(e))
            }
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
        ~run=(inputs, _, accessors: ProjectAccessorsT.t, reducer) =>
          switch inputs {
          | [IEvDistribution(SampleSet(dist)), IEvLambda(lambda)] =>
            Internal.map1(dist, lambda, accessors, reducer)->E.R2.errMap(_ => "")
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
        ~run=(inputs, _, accessors: ProjectAccessorsT.t, reducer) => {
          switch inputs {
          | [
              IEvDistribution(SampleSet(dist1)),
              IEvDistribution(SampleSet(dist2)),
              IEvLambda(lambda),
            ] =>
            Internal.map2(dist1, dist2, lambda, accessors, reducer)->E.R2.errMap(_ => "")
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
        ~run=(inputs, _, accessors: ProjectAccessorsT.t, reducer) =>
          switch inputs {
          | [
              IEvDistribution(SampleSet(dist1)),
              IEvDistribution(SampleSet(dist2)),
              IEvDistribution(SampleSet(dist3)),
              IEvLambda(lambda),
            ] =>
            Internal.map3(dist1, dist2, dist3, lambda, accessors, reducer)->E.R2.errMap(_ => "")
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
        ~run=(inputs, _, accessors: ProjectAccessorsT.t, reducer) =>
          switch inputs {
          | [IEvArray(dists), IEvLambda(lambda)] =>
            Internal.mapN(dists, lambda, accessors, reducer)->E.R2.errMap(_e => {
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

module Comparison = {
  let template = (name, inputs, run) => {
    FnDefinition.make(
      ~name,
      ~inputs,
      ~run=(inputs, _, _, _) => {
        run(inputs)
      },
      (),
    )
  }

  let wrapper = r =>
    r
    ->E.R2.fmap(r => r->Wrappers.sampleSet->Wrappers.evDistribution)
    ->E.R2.errMap(SampleSetDist.Error.toString)

  let mkBig = (name, withDist, withFloat) =>
    Function.make(
      ~name,
      ~nameSpace,
      ~requiresNamespace=false,
      ~examples=[
        `SampleSet.${name}(SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(6,2)))`,
        `SampleSet.${name}(SampleSet.fromDist(normal(5,2)), 3.0)`,
        `SampleSet.${name}(4.0, SampleSet.fromDist(normal(6,2)))`,
      ],
      ~output=ReducerInterface_InternalExpressionValue.EvtDistribution,
      ~definitions=[
        template(name, [FRTypeDist, FRTypeDist], inputs => {
          switch inputs {
          | [IEvDistribution(SampleSet(dist1)), IEvDistribution(SampleSet(dist2))] =>
            withDist(dist1, dist2)->wrapper
          | _ => Error(impossibleError)
          }
        }),
        template(name, [FRTypeDist, FRTypeNumber], inputs => {
          switch inputs {
          | [IEvDistribution(SampleSet(dist)), IEvNumber(f)] => withFloat(dist, f)->wrapper
          | _ => Error(impossibleError)
          }
        }),
        template(name, [FRTypeNumber, FRTypeDist], inputs => {
          switch inputs {
          | [IEvNumber(f), IEvDistribution(SampleSet(dist))] => withFloat(dist, f)->wrapper
          | _ => Error(impossibleError)
          }
        }),
      ],
      (),
    )

  let library = [
    mkBig("min", SampleSetDist.minOfTwo, SampleSetDist.minOfFloat),
    mkBig("max", SampleSetDist.maxOfTwo, SampleSetDist.maxOfFloat),
  ]
}

let library = E.A.append(libaryBase, Comparison.library)
