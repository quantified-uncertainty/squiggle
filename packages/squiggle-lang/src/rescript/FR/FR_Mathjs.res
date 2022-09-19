open FunctionRegistry_Core
open FunctionRegistry_Helpers

// FIXME - copy-pasted (see FR_Date.res and others)
let makeFn = (
  name: string,
  inputs: array<frType>,
  fn: array<internalExpressionValue> => result<internalExpressionValue, errorValue>,
) =>
  Function.make(
    ~name,
    ~nameSpace="",
    ~requiresNamespace=false,
    ~definitions=[FnDefinition.make(~name, ~inputs, ~run=(inputs, _, _, _) => fn(inputs), ())],
    (),
  )

@module("mathjs") external dummy_: string => unit = "evaluate"
let dummy1_ = dummy_ //Deceive the compiler to make the import although we wont make a call from rescript. Otherwise the optimizer deletes the import

let mathjsCall1: (string, float) => 'a = %raw(`function (name, arg) { return Mathjs[name](arg); }`)
let mathjsCall2: (string, float, float) => 'a = %raw(`function (name, arg1, arg2) { return Mathjs[name](arg1, arg2); }`)

let makeMathjsFn1 = (
  name: string
) => {
  makeFn(name, [FRTypeNumber], inputs => {
    switch inputs {
    | [IEvNumber(x)] => mathjsCall1(name, x)->Reducer_Js_Gate.jsToIEv
    | _ => Error(impossibleError)
    }
  })
}

let makeMathjsFn2 = (
  name: string
) => {
  makeFn(name, [FRTypeNumber, FRTypeNumber], inputs => {
    switch inputs {
    | [IEvNumber(x), IEvNumber(y)] => mathjsCall2(name, x, y)->Reducer_Js_Gate.jsToIEv
    | _ => Error(impossibleError)
    }
  })
}

let library = [
  // TODO - other MathJS
  // https://mathjs.org/docs/reference/functions.html

  // Arithmetic functions
  makeMathjsFn1("abs"),
  makeMathjsFn1("cbrt"),
  makeMathjsFn1("ceil"),
  makeMathjsFn1("cube"),
  makeMathjsFn1("exp"),
  makeMathjsFn1("fix"),
  makeMathjsFn1("floor"),

  makeMathjsFn2("gcd"),
  makeMathjsFn2("hypot"),
  makeMathjsFn2("invmod"),
  makeMathjsFn2("lcm"),
  makeMathjsFn1("log"), // Do we need makeMathjsFn2 for `log` too?
  makeMathjsFn1("log10"),
  makeMathjsFn1("log2"),

  makeMathjsFn1("factorial"),
  makeMathjsFn1("cos"),

]
