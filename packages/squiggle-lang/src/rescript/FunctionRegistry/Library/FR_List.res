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

  let map = (array: array<internalExpressionValue>, environment, eLambdaValue, reducer): result<
    ReducerInterface_InternalExpressionValue.t,
    Reducer_ErrorValue.errorValue,
  > => {
    let rMappedList = array->E.A.reduceReverse(Ok(list{}), (rAcc, elem) =>
      rAcc->E.R.bind(_, acc => {
        let rNewElem = Reducer_Expression_Lambda.doLambdaCall(
          eLambdaValue,
          list{elem},
          environment,
          reducer,
        )
        rNewElem->E.R2.fmap(newElem => list{newElem, ...acc})
      })
    )
    rMappedList->E.R2.fmap(mappedList => mappedList->Belt.List.toArray->Wrappers.evArray)
  }

  let reduce = (aValueArray, initialValue, aLambdaValue, environment, reducer) => {
    aValueArray->E.A.reduce(Ok(initialValue), (rAcc, elem) =>
      rAcc->E.R.bind(_, acc =>
        Reducer_Expression_Lambda.doLambdaCall(aLambdaValue, list{acc, elem}, environment, reducer)
      )
    )
  }

  let reduceReverse = (aValueArray, initialValue, aLambdaValue, environment, reducer) => {
    aValueArray->Belt.Array.reduceReverse(Ok(initialValue), (rAcc, elem) =>
      rAcc->Belt.Result.flatMap(acc =>
        Reducer_Expression_Lambda.doLambdaCall(aLambdaValue, list{acc, elem}, environment, reducer)
      )
    )
  }

  let filter = (aValueArray, aLambdaValue, environment, reducer) => {
    let rMappedList = aValueArray->Belt.Array.reduceReverse(Ok(list{}), (rAcc, elem) =>
      rAcc->E.R.bind(_, acc => {
        let rNewElem = Reducer_Expression_Lambda.doLambdaCall(
          aLambdaValue,
          list{elem},
          environment,
          reducer,
        )
        rNewElem->E.R2.fmap(newElem => {
          switch newElem {
          | IEvBool(true) => list{elem, ...acc}
          | _ => acc
          }
        })
      })
    )
    let result = rMappedList->E.R2.fmap(mappedList => mappedList->Belt.List.toArray->Wrappers.evArray)
    result
  }
}

let library = [
  Function.make(
    ~name="make",
    ~nameSpace,
    ~requiresNamespace=true,
    ~output=EvtArray,
    ~examples=[`List.make(2, "testValue")`],
    ~definitions=[
      //Todo: If the second item is a function with no args, it could be nice to run this function and return the result.
      FnDefinition.make(
        ~name="make",
        ~inputs=[FRTypeNumber, FRTypeAny],
        ~run=(inputs, _, _, _) => {
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
    ~requiresNamespace=true,
    ~output=EvtArray,
    ~examples=[`List.upTo(1,4)`],
    ~definitions=[
      FnDefinition.make(
        ~name="upTo",
        ~inputs=[FRTypeNumber, FRTypeNumber],
        ~run=(_, inputs, _, _) =>
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
    ~requiresNamespace=true,
    ~examples=[`List.first([1,4,5])`],
    ~definitions=[
      FnDefinition.make(
        ~name="first",
        ~inputs=[FRTypeArray(FRTypeAny)],
        ~run=(inputs, _, _, _) =>
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
    ~requiresNamespace=true,
    ~examples=[`List.last([1,4,5])`],
    ~definitions=[
      FnDefinition.make(
        ~name="last",
        ~inputs=[FRTypeArray(FRTypeAny)],
        ~run=(inputs, _, _, _) =>
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
    ~requiresNamespace=false,
    ~examples=[`List.reverse([1,4,5])`],
    ~definitions=[
      FnDefinition.make(
        ~name="reverse",
        ~inputs=[FRTypeArray(FRTypeAny)],
        ~run=(inputs, _, _, _) =>
          switch inputs {
          | [IEvArray(array)] => Internals.reverse(array)->Ok
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
    ~output=EvtArray,
    ~requiresNamespace=false,
    ~examples=[`List.map([1,4,5], {|x| x+1})`],
    ~definitions=[
      FnDefinition.make(
        ~name="map",
        ~inputs=[FRTypeArray(FRTypeAny), FRTypeLambda],
        ~run=(inputs, _, env, reducer) =>
          {
            let result = switch inputs {
            | [IEvArray(array), IEvLambda(lambda)] =>
              Internals.map(array, env, lambda, reducer)->E.R2.errMap(_ => "Error!")
            | _ => Error(impossibleError)
            }
            result
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="reduce",
    ~nameSpace,
    ~requiresNamespace=false,
    ~examples=[`List.reduce([1,4,5], 2, {|acc, el| acc+el})`],
    ~definitions=[
      FnDefinition.make(
        ~name="reduce",
        ~inputs=[FRTypeArray(FRTypeAny), FRTypeAny, FRTypeLambda],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [IEvArray(array), initialValue, IEvLambda(lambda)] =>
            Internals.reduce(array, initialValue, lambda, env, reducer)->E.R2.errMap(_ => "Error!")
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="reduceReverse",
    ~nameSpace,
    ~requiresNamespace=false,
    ~examples=[`List.reduceReverse([1,4,5], 2, {|acc, el| acc-el})`],
    ~definitions=[
      FnDefinition.make(
        ~name="reduceReverse",
        ~inputs=[FRTypeArray(FRTypeAny), FRTypeAny, FRTypeLambda],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [IEvArray(array), initialValue, IEvLambda(lambda)] =>
            Internals.reduceReverse(array, initialValue, lambda, env, reducer)->E.R2.errMap(_ =>
              "Error!"
            )
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="filter",
    ~nameSpace,
    ~requiresNamespace=false,
    ~examples=[`List.filter([1,4,5], {|x| x>3})`],
    ~definitions=[
      FnDefinition.make(
        ~name="filter",
        ~inputs=[FRTypeArray(FRTypeAny), FRTypeLambda],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [IEvArray(array), IEvLambda(lambda)] =>
            Internals.filter(array, lambda, env, reducer)->E.R2.errMap(_ => "Error!")
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
]
