open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "" // no namespaced versions

type simpleDefinition = {
  inputs: array<frType>,
  fn: array<internalExpressionValue> => result<internalExpressionValue, errorValue>,
}

let makeFnMany = (name: string, definitions: array<simpleDefinition>) =>
  Function.make(
    ~name,
    ~nameSpace,
    ~requiresNamespace=false,
    ~definitions=definitions->Js.Array2.map(({inputs, fn}) =>
      FnDefinition.make(~name, ~inputs, ~run=(inputs, _, _, _) => fn(inputs), ())
    ),
    (),
  )

let makeFn = (
  name: string,
  inputs: array<frType>,
  fn: array<internalExpressionValue> => result<internalExpressionValue, errorValue>,
) => makeFnMany(name, [{ inputs, fn }])

let makeBinaryFn = (name: string, fn: (float, float) => float) => {
  makeFn(
    name,
    [FRTypeNumber, FRTypeNumber],
    inputs => {
      switch inputs {
      | [IEvNumber(x), IEvNumber(y)] => fn(x, y)->IEvNumber->Ok
      | _ => Error(impossibleError)
      }
    }
  )
}

let library = [
  // TODO - other MathJS
  makeBinaryFn("add", (x, y) => x +. y),
  makeBinaryFn("subtract", (x, y) => x -. y),
  makeBinaryFn("multiply", (x, y) => x *. y),
  makeBinaryFn("divide", (x, y) => x /. y),
]
