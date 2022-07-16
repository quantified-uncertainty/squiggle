open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "List"
let requiresNamespace = true

module Internals = {
  let makeFromNumber = (
    n: float,
    value: internalExpressionValue,
  ): internalExpressionValue => IEvArray(Belt.Array.make(E.Float.toInt(n), value))

  let upTo = (low: float, high: float): internalExpressionValue => IEvArray(
    E.A.Floats.range(low, high, (high -. low +. 1.0)->E.Float.toInt)->E.A2.fmap(Wrappers.evNumber),
  )

  let first = (v: array<internalExpressionValue>): result<internalExpressionValue, string> =>
    v->E.A.first |> E.O.toResult("No first element")

  let last = (v: array<internalExpressionValue>): result<internalExpressionValue, string> =>
    v->E.A.last |> E.O.toResult("No last element")

  let reverse = (array: array<internalExpressionValue>): internalExpressionValue => IEvArray(
    Belt.Array.reverse(array),
  )
}

let library = [
  Function.make(
    ~name="make",
    ~nameSpace,
    ~output=EvtArray,
    ~examples=[`List.make(2, "testValue")`],
    ~definitions=[
      //Todo: If the second item is a function with no args, it could be nice to run this function and return the result.
      FnDefinition.make(
        ~requiresNamespace,
        ~name="make",
        ~inputs=[FRTypeNumber, FRTypeAny],
        ~run=(inputs, _, _) => {
          switch inputs {
          | [IEvNumber(number), value] => Internals.makeFromNumber(number, value)->Ok
          | _ => Error(impossibleError)
          }
        },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="upTo",
    ~nameSpace,
    ~output=EvtArray,
    ~examples=[`List.upTo(1,4)`],
    ~definitions=[
      FnDefinition.make(
        ~requiresNamespace,
        ~name="upTo",
        ~inputs=[FRTypeNumber, FRTypeNumber],
        ~run=(_, inputs, _) =>
          inputs
          ->Prepare.ToValueTuple.twoNumbers
          ->E.R2.fmap(((low, high)) => Internals.upTo(low, high)),
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="first",
    ~nameSpace,
    ~examples=[`List.first([1,4,5])`],
    ~definitions=[
      FnDefinition.make(
        ~requiresNamespace,
        ~name="first",
        ~inputs=[FRTypeArray(FRTypeAny)],
        ~run=(inputs, _, _) =>
          switch inputs {
          | [IEvArray(array)] => Internals.first(array)
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="last",
    ~nameSpace,
    ~examples=[`List.last([1,4,5])`],
    ~definitions=[
      FnDefinition.make(
        ~requiresNamespace=false,
        ~name="last",
        ~inputs=[FRTypeArray(FRTypeAny)],
        ~run=(inputs, _, _) =>
          switch inputs {
          | [IEvArray(array)] => Internals.last(array)
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="reverse",
    ~nameSpace,
    ~output=EvtArray,
    ~examples=[`List.reverse([1,4,5])`],
    ~definitions=[
      FnDefinition.make(
        ~requiresNamespace=false,
        ~name="reverse",
        ~inputs=[FRTypeArray(FRTypeAny)],
        ~run=(inputs, _, _) =>
          switch inputs {
          | [IEvArray(array)] => Internals.reverse(array)->Ok
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
]
