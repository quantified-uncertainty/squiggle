open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "SampleSet"
let requiresNamespace = true

module Internal = {
  type t = SampleSetDist.t

  let doLambdaCall = (
    aLambdaValue,
    list,
    context: Reducer_T.context,
    reducer: Reducer_T.reducerFn,
  ) =>
    switch Reducer_Lambda.doLambdaCall(aLambdaValue, list, context, reducer) {
    | IEvNumber(f) => Ok(f)
    | _ => Error(Operation.SampleMapNeedsNtoNFunction)
    }

  let toType = (r): result<Reducer_T.value, SqError.Message.t> =>
    switch r {
    | Ok(r) => Ok(Wrappers.evDistribution(SampleSet(r)))
    | Error(r) => Error(REDistributionError(SampleSetError(r)))
    }

  //TODO: I don't know why this seems to need at least one input
  let fromFn = (aLambdaValue, context: Reducer_T.context, reducer: Reducer_T.reducerFn) => {
    let sampleCount = context.environment.sampleCount
    let fn = r => doLambdaCall(aLambdaValue, [IEvNumber(r)], context, reducer)
    E.A.makeBy(sampleCount, r => fn(r->Js.Int.toFloat))->E.A.R.firstErrorOrOpen
  }

  let map1 = (sampleSetDist: t, aLambdaValue, context: Reducer_T.context, reducer) => {
    let fn = r => doLambdaCall(aLambdaValue, [IEvNumber(r)], context, reducer)
    SampleSetDist.samplesMap(~fn, sampleSetDist)->toType
  }

  let map2 = (t1: t, t2: t, aLambdaValue, context: Reducer_T.context, reducer) => {
    let fn = (a, b) => doLambdaCall(aLambdaValue, [IEvNumber(a), IEvNumber(b)], context, reducer)
    SampleSetDist.map2(~fn, ~t1, ~t2)->toType
  }

  let map3 = (t1: t, t2: t, t3: t, aLambdaValue, context: Reducer_T.context, reducer) => {
    let fn = (a, b, c) =>
      doLambdaCall(aLambdaValue, [IEvNumber(a), IEvNumber(b), IEvNumber(c)], context, reducer)
    SampleSetDist.map3(~fn, ~t1, ~t2, ~t3)->toType
  }

  let parseSampleSetArray = (arr: array<Reducer_T.value>): option<array<SampleSetDist.t>> => {
    let parseSampleSet = (value: Reducer_T.value): option<SampleSetDist.t> =>
      switch value {
      | IEvDistribution(SampleSet(dist)) => Some(dist)
      | _ => None
      }
    E.A.O.openIfAllSome(E.A.fmap(arr, parseSampleSet))
  }

  let mapN = (
    aValueArray: array<Reducer_T.value>,
    aLambdaValue,
    context: Reducer_T.context,
    reducer,
  ) => {
    switch parseSampleSetArray(aValueArray) {
    | Some(t1) =>
      let fn = a =>
        doLambdaCall(
          aLambdaValue,
          [IEvArray(E.A.fmap(a, x => Wrappers.evNumber(x)))],
          context,
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
    ~output=Reducer_Value.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="fromDist",
        ~inputs=[FRTypeDist],
        ~run=(inputs, context, _) =>
          switch inputs {
          | [IEvDistribution(dist)] =>
            GenericDist.toSampleSetDist(dist, context.environment.sampleCount)
            ->E.R.fmap(Wrappers.sampleSet)
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
    ~name="fromList",
    ~nameSpace,
    ~requiresNamespace=true,
    ~examples=[`SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5,3,2,3,1,1,3])`],
    ~output=Reducer_Value.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="fromList",
        ~inputs=[FRTypeArray(FRTypeNumber)],
        ~run=(inputs, _, _) => {
          let sampleSet =
            inputs
            ->Prepare.ToTypedArray.numbers
            ->E.R.bind(r => SampleSetDist.make(r)->E.R.errMap(SampleSetDist.Error.toString))
          sampleSet
          ->E.R.fmap(Wrappers.sampleSet)
          ->E.R.fmap(Wrappers.evDistribution)
          ->E.R.errMap(wrapError)
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
    ~output=Reducer_Value.EvtArray,
    ~definitions=[
      FnDefinition.make(
        ~name="toList",
        ~inputs=[FRTypeDist],
        ~run=(inputs, _, _) =>
          switch inputs {
          | [IEvDistribution(SampleSet(dist))] =>
            dist->E.A.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
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
    ~output=Reducer_Value.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="fromFn",
        ~inputs=[FRTypeLambda],
        ~run=(inputs, context, reducer) =>
          switch inputs {
          | [IEvLambda(lambda)] =>
            switch Internal.fromFn(lambda, context, reducer) {
            | Ok(r) => Ok(r->Wrappers.sampleSet->Wrappers.evDistribution)
            | Error(e) => e->SqError.Message.REOperationError->Error
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
    ~output=Reducer_Value.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="map",
        ~inputs=[FRTypeDist, FRTypeLambda],
        ~run=(inputs, context, reducer) =>
          switch inputs {
          | [IEvDistribution(SampleSet(dist)), IEvLambda(lambda)] =>
            Internal.map1(dist, lambda, context, reducer)
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
    ~output=Reducer_Value.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="map2",
        ~inputs=[FRTypeDist, FRTypeDist, FRTypeLambda],
        ~run=(inputs, context, reducer) => {
          switch inputs {
          | [
              IEvDistribution(SampleSet(dist1)),
              IEvDistribution(SampleSet(dist2)),
              IEvLambda(lambda),
            ] =>
            Internal.map2(dist1, dist2, lambda, context, reducer)
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
    ~output=Reducer_Value.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="map3",
        ~inputs=[FRTypeDist, FRTypeDist, FRTypeDist, FRTypeLambda],
        ~run=(inputs, context, reducer) =>
          switch inputs {
          | [
              IEvDistribution(SampleSet(dist1)),
              IEvDistribution(SampleSet(dist2)),
              IEvDistribution(SampleSet(dist3)),
              IEvLambda(lambda),
            ] =>
            Internal.map3(dist1, dist2, dist3, lambda, context, reducer)
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
    ~output=Reducer_Value.EvtDistribution,
    ~definitions=[
      FnDefinition.make(
        ~name="mapN",
        ~inputs=[FRTypeArray(FRTypeDist), FRTypeLambda],
        ~run=(inputs, context, reducer) =>
          switch inputs {
          | [IEvArray(dists), IEvLambda(lambda)] => Internal.mapN(dists, lambda, context, reducer)
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
      ~run=(inputs, _, _) => {
        run(inputs)
      },
      (),
    )
  }

  let wrapper = r =>
    r
    ->E.R.fmap(r => r->Wrappers.sampleSet->Wrappers.evDistribution)
    ->E.R.errMap(e =>
      e->DistributionTypes.Error.sampleErrorToDistErr->SqError.Message.REDistributionError
    )

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
      ~output=Reducer_Value.EvtDistribution,
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

let library = E.A.concat(libaryBase, Comparison.library)
