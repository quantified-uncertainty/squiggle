open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Dict"

module Internals = {
  type t = Reducer_T.map

  let keys = (a: t): Reducer_T.value => IEvArray(
    Belt.Map.String.keysToArray(a)->E.A.fmap(Wrappers.evString),
  )

  let values = (a: t): Reducer_T.value => IEvArray(Belt.Map.String.valuesToArray(a))

  let toList = (a: t): Reducer_T.value =>
    Belt.Map.String.toArray(a)
    ->E.A.fmap(((key, value)) => Wrappers.evArray([IEvString(key), value]))
    ->Wrappers.evArray

  let fromList = (items: array<Reducer_T.value>): result<Reducer_T.value, errorMessage> =>
    items
    ->E.A.fmap(item => {
      switch (item: Reducer_T.value) {
      | IEvArray([IEvString(string), value]) => (string, value)->Ok
      | _ => Error(impossibleError)
      }
    })
    ->E.A.R.firstErrorOrOpen
    ->E.R.fmap(Belt.Map.String.fromArray)
    ->E.R.fmap(Wrappers.evRecord)

  let set = (a: t, key, value): Reducer_T.value => IEvRecord(Belt.Map.String.set(a, key, value))

  //Belt.Map.String has a function for mergeMany, but I couldn't understand how to use it yet.
  let mergeMany = (a: array<t>): Reducer_T.value => {
    let mergedValues =
      a->E.A.fmap(Belt.Map.String.toArray)->E.A.concatMany->Belt.Map.String.fromArray
    IEvRecord(mergedValues)
  }

  let map = (
    dict: t,
    eLambdaValue,
    context: Reducer_T.context,
    reducer: Reducer_T.reducerFn,
  ): Reducer_T.value => {
    Belt.Map.String.map(dict, elem =>
      Reducer_Lambda.doLambdaCall(eLambdaValue, [elem], context, reducer)
    )->Wrappers.evRecord
  }
}

let library = [
  Function.make(
    ~name="set",
    ~nameSpace,
    ~requiresNamespace=true,
    ~output=EvtRecord,
    ~examples=[`Dict.set({a: 1, b: 2}, "c", 3)`],
    ~definitions=[
      FnDefinition.make(
        ~name="set",
        ~inputs=[FRTypeDict(FRTypeAny), FRTypeString, FRTypeAny],
        ~run=(inputs, _, _) => {
          switch inputs {
          | [IEvRecord(dict), IEvString(key), value] => Internals.set(dict, key, value)->Ok
          | _ => Error(impossibleError)
          }
        },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="merge",
    ~nameSpace,
    ~requiresNamespace=true,
    ~output=EvtRecord,
    ~examples=[`Dict.merge({a: 1, b: 2}, {c: 3, d: 4})`],
    ~definitions=[
      FnDefinition.make(
        ~name="merge",
        ~inputs=[FRTypeDict(FRTypeAny), FRTypeDict(FRTypeAny)],
        ~run=(inputs, _, _) => {
          switch inputs {
          | [IEvRecord(d1), IEvRecord(d2)] => Internals.mergeMany([d1, d2])->Ok
          | _ => impossibleError->Error
          }
        },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="mergeMany",
    ~nameSpace,
    ~requiresNamespace=true,
    ~output=EvtRecord,
    ~examples=[`Dict.mergeMany([{a: 1, b: 2}, {c: 3, d: 4}])`],
    ~definitions=[
      FnDefinition.make(
        ~name="mergeMany",
        ~inputs=[FRTypeArray(FRTypeDict(FRTypeAny))],
        ~run=(inputs, _, _) => {
          switch inputs {
          | [IEvArray(dicts)] =>
            dicts
            ->E.A.fmap(dictValue =>
              switch dictValue {
              | IEvRecord(dict) => dict
              | _ => impossibleError->SqError.Message.throw
              }
            )
            ->Internals.mergeMany
            ->Ok
          | _ => impossibleError->Error
          }
        },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="keys",
    ~nameSpace,
    ~requiresNamespace=true,
    ~output=EvtArray,
    ~examples=[`Dict.keys({a: 1, b: 2})`],
    ~definitions=[
      FnDefinition.make(
        ~name="keys",
        ~inputs=[FRTypeDict(FRTypeAny)],
        ~run=(inputs, _, _) =>
          switch inputs {
          | [IEvRecord(d1)] => Internals.keys(d1)->Ok
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="values",
    ~nameSpace,
    ~requiresNamespace=true,
    ~output=EvtArray,
    ~examples=[`Dict.values({a: 1, b: 2})`],
    ~definitions=[
      FnDefinition.make(
        ~name="values",
        ~inputs=[FRTypeDict(FRTypeAny)],
        ~run=(inputs, _, _) =>
          switch inputs {
          | [IEvRecord(d1)] => Internals.values(d1)->Ok
          | _ => Error(impossibleError)
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
    ~output=EvtArray,
    ~examples=[`Dict.toList({a: 1, b: 2})`],
    ~definitions=[
      FnDefinition.make(
        ~name="toList",
        ~inputs=[FRTypeDict(FRTypeAny)],
        ~run=(inputs, _, _) =>
          switch inputs {
          | [IEvRecord(dict)] => dict->Internals.toList->Ok
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
    ~output=EvtRecord,
    ~examples=[`Dict.fromList([["a", 1], ["b", 2]])`],
    ~definitions=[
      FnDefinition.make(
        ~name="fromList",
        ~inputs=[FRTypeArray(FRTypeArray(FRTypeAny))],
        ~run=(inputs, _, _) => {
          switch inputs {
          | [IEvArray(items)] => Internals.fromList(items)
          | _ => Error(impossibleError)
          }
        },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="map",
    ~nameSpace,
    ~requiresNamespace=true,
    ~output=EvtRecord,
    ~examples=[`Dict.map({a: 1, b: 2}, {|x| x + 1})`],
    ~definitions=[
      FnDefinition.make(
        ~name="map",
        ~inputs=[FRTypeDict(FRTypeAny), FRTypeLambda],
        ~run=(inputs, context, reducer) =>
          switch inputs {
          | [IEvRecord(dict), IEvLambda(lambda)] =>
            Ok(Internals.map(dict, lambda, context, reducer))
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
]
