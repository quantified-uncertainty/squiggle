open ReducerInterface.ExpressionValue
open Reducer_ErrorValue

external castBool: unit => bool = "%identity"
external castNumber: unit => float = "%identity"
external castString: unit => string = "%identity"

/*
  As JavaScript returns us any type, we need to type check and cast type propertype before using it
*/
let jsToEv = (jsValue): result<expressionValue, errorValue> => {
  switch Js.typeof(jsValue) {
  | "boolean" => jsValue->castBool->EvBool->Ok
  | "number" => jsValue->castNumber->EvNumber->Ok
  | "string" => jsValue->castString->EvString->Ok
  | other => RETodo(`Unhandled MathJs literal type: ${Js.String.make(other)}`)->Error
  }
}
