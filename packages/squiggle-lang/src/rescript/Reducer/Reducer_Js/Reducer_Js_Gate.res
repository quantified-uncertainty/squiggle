open ReducerInterface_InternalExpressionValue
open Reducer_ErrorValue

external castBool: unit => bool = "%identity"
external castNumber: unit => float = "%identity"
external castString: unit => string = "%identity"

/*
  As JavaScript returns us any type, we need to type check and cast type propertype before using it
*/
let jsToIev = (jsValue): result<expressionValue, errorValue> =>
  switch Js.typeof(jsValue) {
  | "boolean" => jsValue->castBool->IevBool->Ok
  | "number" => jsValue->castNumber->IevNumber->Ok
  | "string" => jsValue->castString->IevString->Ok
  | other => RETodo(`Unhandled MathJs literal type: ${Js.String.make(other)}`)->Error
  }
