open ReducerInterface_InternalExpressionValue
open Reducer_ErrorValue

external castBool: unit => bool = "%identity"
external castNumber: unit => float = "%identity"
external castString: unit => string = "%identity"

/*
  As JavaScript returns us any type, we need to type check and cast type propertype before using it
*/
let jsToIEv = (jsValue): result<expressionValue, errorValue> =>
  switch Js.typeof(jsValue) {
  | "boolean" => jsValue->castBool->IEvBool->Ok
  | "number" => jsValue->castNumber->IEvNumber->Ok
  | "string" => jsValue->castString->IEvString->Ok
  | other => RETodo(`Unhandled MathJs literal type: ${Js.String.make(other)}`)->Error
  }
