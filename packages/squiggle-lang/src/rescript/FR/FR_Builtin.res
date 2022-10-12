open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "" // no namespaced versions

type simpleDefinition = {
  inputs: array<frType>,
  fn: array<Reducer_T.value> => result<Reducer_T.value, errorMessage>,
}

let makeFnMany = (name: string, definitions: array<simpleDefinition>) =>
  Function.make(
    ~name,
    ~nameSpace,
    ~requiresNamespace=false,
    ~definitions=definitions->Js.Array2.map(({inputs, fn}) =>
      FnDefinition.make(~name, ~inputs, ~run=(inputs, _, _) => fn(inputs), ())
    ),
    (),
  )

let makeFn = (
  name: string,
  inputs: array<frType>,
  fn: array<Reducer_T.value> => result<Reducer_T.value, errorMessage>,
) => makeFnMany(name, [{inputs, fn}])

let library = [
  Make.ff2f(~name="add", ~fn=(x, y) => x +. y, ()), // infix + (see Reducer/Reducer_Peggy/helpers.ts)
  Make.ff2f(~name="subtract", ~fn=(x, y) => x -. y, ()), // infix -
  Make.ff2f(~name="multiply", ~fn=(x, y) => x *. y, ()), // infix *
  Make.ff2f(~name="divide", ~fn=(x, y) => x /. y, ()), // infix /
  Make.ff2f(~name="pow", ~fn=(x, y) => Js.Math.pow_float(~base=x, ~exp=y), ()), // infix ^
  Make.ff2b(~name="equal", ~fn=(x, y) => x == y, ()), // infix == on numbers
  Make.bb2b(~name="equal", ~fn=(x, y) => x == y, ()), // infix == on booleans
  Make.ff2b(~name="unequal", ~fn=(x, y) => x != y, ()), // infix != on numbers
  Make.ff2b(~name="unequal", ~fn=(x, y) => x != y, ()), // infix != on booleans
  Make.ff2b(~name="smaller", ~fn=(x, y) => x < y, ()), // infix <
  Make.ff2b(~name="smallerEq", ~fn=(x, y) => x <= y, ()), // infix <=
  Make.ff2b(~name="larger", ~fn=(x, y) => x > y, ()), // infix >
  Make.ff2b(~name="largerEq", ~fn=(x, y) => x >= y, ()), // infix >=
  Make.bb2b(~name="or", ~fn=(x, y) => x || y, ()), // infix ||
  Make.bb2b(~name="and", ~fn=(x, y) => x && y, ()), // infix &&
  Make.f2f(~name="unaryMinus", ~fn=x => -.x, ()), // unary prefix -
  makeFn("not", [FRTypeNumber], inputs => {
    // unary prefix !
    switch inputs {
    | [IEvNumber(x)] => IEvBool(x != 0.)->Ok
    | _ => Error(impossibleError)
    }
  }),
  makeFn("not", [FRTypeBool], inputs => {
    // unary prefix !
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
        Js.log(value->Reducer_Value.toString)
        value->Ok
      }

    | _ => Error(impossibleError)
    }
  }),
  makeFn("inspect", [FRTypeAny, FRTypeString], inputs => {
    switch inputs {
    | [value, IEvString(label)] => {
        Js.log(`${label}: ${value->Reducer_Value.toString}`)
        value->Ok
      }

    | _ => Error(impossibleError)
    }
  }),
  makeFn("javascriptraise", [FRTypeAny], inputs => {
    switch inputs {
    | [msg] => Js.Exn.raiseError(msg->Reducer_Value.toString)
    | _ => Error(impossibleError)
    }
  }),
]
