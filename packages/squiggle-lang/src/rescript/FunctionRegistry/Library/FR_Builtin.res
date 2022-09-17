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
  makeFn(
    "concat",
    [FRTypeString, FRTypeString],
    inputs => {
      switch inputs {
      | [IEvString(a), IEvString(b)] => {
        let answer = Js.String2.concat(a, b)
        answer->Reducer_T.IEvString->Ok
      }
      | _ => Error(impossibleError)
      }
    }
  ),
  makeFn(
    "concat",
    [FRTypeArray(FRTypeAny), FRTypeArray(FRTypeAny)],
    inputs => {
      switch inputs {
      | [IEvArray(originalA), IEvArray(b)] => {
        let a = originalA->Js.Array2.copy
        let _ = Js.Array2.pushMany(a, b)
        a->Reducer_T.IEvArray->Ok
      }
      | _ => Error(impossibleError)
      }
    }
  ),
  makeFn(
    "inspect",
    [FRTypeAny],
    inputs => {
      switch inputs {
      | [value] => {
        Js.log(value->ReducerInterface_InternalExpressionValue.toString)
        value->Ok
      }
      | _ => Error(impossibleError)
      }
    }
  ),
  makeFn(
    "inspect",
    [FRTypeAny, FRTypeString],
    inputs => {
      switch inputs {
      | [value, IEvString(label)] => {
        Js.log(`${label}: ${value->ReducerInterface_InternalExpressionValue.toString}`)
        value->Ok
      }
      | _ => Error(impossibleError)
      }
    }
  ),
]
