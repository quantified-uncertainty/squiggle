module CTV = Reducer_Extension.CodeTreeValue
module JsG = Reducer_Js_Gate
module Rerr = Reducer_Error

type codeTreeValue = CTV.codeTreeValue
type reducerError = Rerr.reducerError

@module("mathjs") external dummy_: string => unit = "evaluate"
let dummy1_ = dummy_ //Deceive the compiler to make the import although we wont make a call from rescript. Otherwise the optimizer deletes the import

type answer = {
  "value": unit
}

/*
 The result has to be delivered in an object so that we can type cast.
 Rescript cannot type cast on basic values passed on their own.
 This is why we call evalua inside Javascript and wrap the result in an Object
 */
let eval__ = %raw(`function (expr) { return {value: Mathjs.evaluate(expr)}; }`)

/*
  Call MathJs evaluate and return as a variant
*/
let eval = (expr: string): result<codeTreeValue, reducerError> => {
  try {
  let answer = eval__(expr)
  answer["value"]->JsG.jsToCtv
  } catch {
  | Js.Exn.Error(obj) =>
    RerrJs(Js.Exn.message(obj), Js.Exn.name(obj))->Error
  }
}
