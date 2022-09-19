open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Dict"

module Internals = {
  type t = Reducer_T.map

  let keys = (a: t): internalExpressionValue => IEvArray(
    Belt.Map.String.keysToArray(a)->E.A2.fmap(Wrappers.evString),
  )

  let values = (a: t): internalExpressionValue => IEvArray(Belt.Map.String.valuesToArray(a))

  let toList = (a: t): internalExpressionValue =>
    Belt.Map.String.toArray(a)
    ->E.A2.fmap(((key, value)) => Wrappers.evArray([IEvString(key), value]))
    ->Wrappers.evArray

  let fromList = (items: array<internalExpressionValue>): result<
    internalExpressionValue,
    errorValue,
  > =>
    items
    ->E.A2.fmap(item => {
      switch (item: internalExpressionValue) {
      | IEvArray([IEvString(string), value]) => (string, value)->Ok
      | _ => Error(impossibleError)
      }
    })
    ->E.A.R.firstErrorOrOpen
    ->E.R2.fmap(Belt.Map.String.fromArray)
    ->E.R2.fmap(Wrappers.evRecord)

  let merge = (a: t, b: t): internalExpressionValue => IEvRecord(
    Belt.Map.String.merge(a, b, (_, _, c) => c),
  )

  //Belt.Map.String has a function for mergeMany, but I couldn't understand how to use it yet.
  let mergeMany = (a: array<t>): internalExpressionValue => {
    let mergedValues =
      a->E.A2.fmap(Belt.Map.String.toArray)->Belt.Array.concatMany->Belt.Map.String.fromArray
    IEvRecord(mergedValues)
  }
}

let library = [
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
        ~run=(inputs, _, _, _) => {
          switch inputs {
          | [IEvRecord(d1), IEvRecord(d2)] => Internals.merge(d1, d2)->Ok
          | _ => Error(impossibleError)
          }
        },
        (),
      ),
    ],
    (),
  ),
  //TODO: Change to use new mergeMany() function.
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
        ~run=(_, inputs, _, _) =>
          inputs
          ->Prepare.ToTypedArray.dicts
          ->E.R2.fmap(E.Dict.concatMany)
          ->E.R2.fmap(Js.Dict.map((. r) => FunctionRegistry_Core.FRType.matchReverse(r)))
          ->E.R2.fmap(r => r->Js.Dict.entries->Belt.Map.String.fromArray)
          ->E.R2.fmap(Wrappers.evRecord)
          ->E.R2.errMap(e => e->Reducer_ErrorValue.REOther),
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
        ~run=(inputs, _, _, _) =>
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
        ~run=(inputs, _, _, _) =>
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
        ~run=(inputs, _, _, _) =>
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
        ~run=(inputs, _, _, _) => {
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
]
