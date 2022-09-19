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
) => makeFnMany(name, [{inputs: inputs, fn: fn}])

let library = [
  Make.ff2f(
    ~name="add", // infix + (see Reducer/Reducer_Peggy/helpers.ts)
    ~fn=(x, y) => x +. y,
    ()
  ),
  Make.ff2f(
    ~name="subtract", // infix -
    ~fn=(x, y) => x -. y,
    ()
  ),
  Make.ff2f(
    ~name="multiply", // infix *
    ~fn=(x, y) => x *. y,
    ()
  ),
  Make.ff2f(
    ~name="divide", // infix /
    ~fn=(x, y) => x /. y,
    ()
  ),
  Make.ff2f(
    ~name="pow", // infix ^
    ~fn=(x, y) => Js.Math.pow_float(~base=x, ~exp=y),
    ()
  ),
  Make.ff2b(
    ~name="equal", // infix == on numbers
    ~fn=(x, y) => x == y,
    ()
  ),
  Make.bb2b(
    ~name="equal", // infix == on booleans
    ~fn=(x, y) => x == y,
    ()
  ),
  Make.ff2b(
    ~name="unequal", // infix != on numbers
    ~fn=(x, y) => x != y,
    ()
  ),
  Make.ff2b(
    ~name="unequal", // infix != on booleans
    ~fn=(x, y) => x != y,
    ()
  ),
  Make.ff2b(
    ~name="smaller", // infix <
    ~fn=(x, y) => x < y,
    ()
  ),
  Make.ff2b(
    ~name="smallerEq", // infix <=
    ~fn=(x, y) => x <= y,
    ()
  ),
  Make.ff2b(
    ~name="larger", // infix >
    ~fn=(x, y) => x > y,
    ()
  ),
  Make.ff2b(
    ~name="largerEq", // infix >=
    ~fn=(x, y) => x >= y,
    ()
  ),
  Make.bb2b(
    ~name="or", // infix ||
    ~fn=(x, y) => x || y,
    ()
  ),
  Make.bb2b(
    ~name="and", // infix &&
    ~fn=(x, y) => x && y,
    ()
  ),
  Make.f2f(
    ~name="unaryMinus", // unary prefix -
    ~fn=x => -.x,
    ()
  ),
  makeFn("not", [FRTypeNumber], inputs => { // unary prefix !
    switch inputs {
    | [IEvNumber(x)] => IEvBool(x != 0.)->Ok
    | _ => Error(impossibleError)
    }
  }),
  makeFn("not", [FRTypeBool], inputs => { // unary prefix !
    switch inputs {
    | [IEvBool(x)] => IEvBool(!x)->Ok
    | _ => Error(impossibleError)
    }
  }),
  makeFn("concat", [FRTypeString, FRTypeString], inputs => {
    switch inputs {
    | [IEvString(a), IEvString(b)] => {
        let answer = Js.String2.concat(a, b)
        answer->Reducer_T.IEvString->Ok
      }
    | _ => Error(impossibleError)
    }
  }),
  makeFn("concat", [FRTypeArray(FRTypeAny), FRTypeArray(FRTypeAny)], inputs => {
    switch inputs {
    | [IEvArray(originalA), IEvArray(b)] => {
        let a = originalA->Js.Array2.copy
        let _ = Js.Array2.pushMany(a, b)
        a->Reducer_T.IEvArray->Ok
      }
    | _ => Error(impossibleError)
    }
  }),
  makeFn("inspect", [FRTypeAny], inputs => {
    switch inputs {
    | [value] => {
        Js.log(value->ReducerInterface_InternalExpressionValue.toString)
        value->Ok
      }
    | _ => Error(impossibleError)
    }
  }),
  makeFn("inspect", [FRTypeAny, FRTypeString], inputs => {
    switch inputs {
    | [value, IEvString(label)] => {
        Js.log(`${label}: ${value->ReducerInterface_InternalExpressionValue.toString}`)
        value->Ok
      }
    | _ => Error(impossibleError)
    }
  }),
  makeFn("javascriptraise", [FRTypeAny], inputs => {
    switch inputs {
    | [msg] => {
        Js.Exn.raiseError(msg->ReducerInterface_InternalExpressionValue.toString)
      }
    | _ => Error(impossibleError)
    }
  }),
]
