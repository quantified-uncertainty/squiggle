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

let makeBinaryCmpFn = (name: string, fn: (float, float) => bool) => {
  makeFn(
    name,
    [FRTypeNumber, FRTypeNumber],
    inputs => {
      switch inputs {
      | [IEvNumber(x), IEvNumber(y)] => fn(x, y)->IEvBool->Ok
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
  makeBinaryFn("pow", (x, y) => Js.Math.pow_float(~base=x, ~exp=y)),
  makeBinaryCmpFn("equal", (x, y) => x == y),
  makeBinaryCmpFn("smaller", (x, y) => x < y),
  makeBinaryCmpFn("smallerEq", (x, y) => x <= y),
  makeBinaryCmpFn("larger", (x, y) => x > y),
  makeBinaryCmpFn("largerEq", (x, y) => x >= y),
  makeFn(
    "unaryMinus",
    [FRTypeNumber],
    inputs => {
      switch inputs {
      | [IEvNumber(x)] => IEvNumber(-.x)->Ok
      | _ => Error(impossibleError)
      }
    }
  ),
  makeFn(
    "not",
    [FRTypeNumber],
    inputs => {
      switch inputs {
      | [IEvNumber(x)] => IEvBool(x != 0.)->Ok
      | _ => Error(impossibleError)
      }
    }
  ),
  makeFn(
    "not",
    [FRTypeBool],
    inputs => {
      switch inputs {
      | [IEvBool(x)] => IEvBool(!x)->Ok
      | _ => Error(impossibleError)
      }
    }
  ),
]
