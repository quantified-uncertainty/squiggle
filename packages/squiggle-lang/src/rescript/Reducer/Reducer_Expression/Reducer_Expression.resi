module Result = Belt.Result
module T = Reducer_Expression_T
type expression = T.expression
type expressionValue = ReducerInterface.ExpressionValue.expressionValue
type t = expression
let show: T.expression => Js.String.t
let showResult: result<T.expression, 'a> => string
let parse_: (
  string,
  string => Result.t<'a, Reducer_ErrorValue.t>,
  'a => Result.t<expression, Reducer_ErrorValue.t>,
) => result<expression, Reducer_ErrorValue.t>
let parse: string => result<expression, Reducer_ErrorValue.t>
module MapString = Belt.Map.String
type bindings = MapString.t<unit>
let defaultBindings: bindings
let reduceValueList: list<expressionValue> => result<
  expressionValue,
  Reducer_ErrorValue.t,
>
let reduceExpression: (expression, 'a) => result<
  expressionValue,
  Reducer_ErrorValue.t,
>
let evalWBindingsExpression: (expression, 'a) => result<
  expressionValue,
  Reducer_ErrorValue.t,
>
let evalWBindings: (string, bindings) => Result.t<
  expressionValue,
  Reducer_ErrorValue.t,
>
let eval: string => Result.t<expressionValue, Reducer_ErrorValue.t>
