open FunctionRegistry_Core
open FunctionRegistry_Helpers

// FIXME - copy-pasted (see FR_Date.res and others)
let makeFn = (
  name: string,
  inputs: array<frType>,
  fn: array<internalExpressionValue> => result<internalExpressionValue, errorValue>
) =>
  Function.make(
    ~name,
    ~nameSpace="",
    ~requiresNamespace=false,
    ~definitions=[
      FnDefinition.make(~name, ~inputs, ~run=(inputs, _, _, _) => fn(inputs), ())
    ],
    ()
  )

@module("mathjs") external dummy_: string => unit = "evaluate"
let dummy1_ = dummy_ //Deceive the compiler to make the import although we wont make a call from rescript. Otherwise the optimizer deletes the import

let mathjsFactorial: float => 'a = %raw(`function (expr) { return Mathjs.factorial(expr); }`)

let library = [
  // TODO - other MathJS
  // https://mathjs.org/docs/reference/functions.html
  makeFn(
    "factorial",
    [FRTypeNumber],
    inputs => {
      switch inputs {
      | [IEvNumber(x)] => mathjsFactorial(x)->Reducer_Js_Gate.jsToIEv
      | _ => Error(impossibleError)
      }
    }
  ),
]
