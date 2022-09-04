open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Danger"
let requiresNamespace = true

module NumberToNumber = {
  let make = (name, fn) =>
    FnDefinition.make(
      ~name,
      ~inputs=[FRTypeNumber],
      ~run=(_, inputs, _, _) => {
        inputs
        ->getOrError(0)
        ->E.R.bind(Prepare.oneNumber)
        ->E.R2.fmap(fn)
        ->E.R2.fmap(Wrappers.evNumber)
      },
      (),
    )
}

module TwoNumbersToNumber = {
  let make = (name, fn) =>
    FnDefinition.make(
      ~name,
      ~inputs=[FRTypeNumber, FRTypeNumber],
      ~run=(_, inputs, _, _) => {
        inputs->Prepare.ToValueTuple.twoNumbers->E.R2.fmap(fn)->E.R2.fmap(Wrappers.evNumber)
      },
      (),
    )
}

module ThreeNumbersToNumber = {
  let make = (name, fn) =>
    FnDefinition.make(
      ~name,
      ~inputs=[FRTypeNumber, FRTypeNumber, FRTypeNumber],
      ~run=(_, inputs, _, _) => {
        inputs->Prepare.ToValueTuple.threeNumbers->E.R2.fmap(fn)->E.R2.fmap(Wrappers.evNumber)
      },
      (),
    )
}

module FunctionToNumberZero = {
  let make = (name, fn) =>
    FnDefinition.make(
      ~name,
      ~inputs=[FRTypeLambda],
      ~run=(_, inputs, _, _) => {
        Ok(0.0)->E.R2.fmap(Wrappers.evNumber)
      },
      (),
    )
}

module Internals = {
  let factorial = Stdlib.Math.factorial
  let choose = ((n, k)) => factorial(n) /. (factorial(n -. k) *. factorial(k))
  let pow = (base, exp) => Js.Math.pow_float(~base, ~exp)
  let binomial = ((n, k, p)) => choose((n, k)) *. pow(p, k) *. pow(1.0 -. p, n -. k)
  let map = (num: internalExpressionValue, environment, eLambdaValue, reducer): result<
    ReducerInterface_InternalExpressionValue.t,
    Reducer_ErrorValue.errorValue,
  > => {
    let x = num
    let wrappedY = {
        let result2 = Reducer_Expression_Lambda.doLambdaCall(
            eLambdaValue,
            list{x},
            environment,
            reducer,
          )
        let result3 = switch(result2){
          | Ok(a) => Ok(list{a})
          | Error(b) => Error(b)
        }
        result3
      }
    wrappedY->E.R2.fmap(mappedList => mappedList->Belt.List.toArray->Wrappers.evArray)
  }

}

let library = [
  Function.make(
    ~name="laplace",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`Danger.laplace(1, 20)`],
    ~definitions=[
      TwoNumbersToNumber.make("laplace", ((successes, trials)) =>
        (successes +. 1.0) /. (trials +. 2.0)
      ),
    ],
    (),
  ),
  Function.make(
    ~name="factorial",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`Danger.factorial(20)`],
    ~definitions=[NumberToNumber.make("factorial", Internals.factorial)],
    (),
  ),
  Function.make(
    ~name="choose",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`Danger.choose(1, 20)`],
    ~definitions=[TwoNumbersToNumber.make("choose", Internals.choose)],
    (),
  ),
  Function.make(
    ~name="binomial",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`Danger.binomial(1, 20, 0.5)`],
    ~definitions=[ThreeNumbersToNumber.make("binomial", Internals.binomial)],
    (),
  ),
  Function.make(
    ~name="functionToZero",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`Danger.functionToZero({|x| x})`],
    ~definitions=[FunctionToNumberZero.make("functionToZero", x => x)],
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
        ~inputs=[FRTypeNumber, FRTypeLambda],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [num, IEvLambda(lambda)] =>
            Internals.map(num, env, lambda, reducer)->E.R2.errMap(_ => "Error!")
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
]
