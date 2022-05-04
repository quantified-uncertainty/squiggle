/*
  An expression is a Lisp AST. An expression is either a primitive value or a list of expressions.
  In the case of a list of expressions (e1, e2, e3, ...eN), the semantic is
     apply e1, e2 -> apply e3 -> ... -> apply eN
  This is Lisp semantics. It holds true in both eager and lazy evaluations.
  A Lisp AST contains only expressions/primitive values to apply to their left.
  The act of defining the semantics of a functional language is to write it in terms of Lisp AST.
*/
module Extra = Reducer_Extra
module ExpressionValue = ReducerInterface.ExpressionValue

type expressionValue = ExpressionValue.expressionValue
type environment = ExpressionValue.environment

type rec expression =
  | EList(list<expression>) // A list to map-reduce
  | EValue(expressionValue) // Irreducible built-in value. Reducer should not know the internals. External libraries are responsible
and bindings = Belt.Map.String.t<expressionValue>

type reducerFn = (
  expression,
  bindings,
  environment,
) => result<expressionValue, Reducer_ErrorValue.errorValue>

/*
  Converts the expression to String
*/
let rec toString = expression =>
  switch expression {
  | EList(aList) =>
    `(${Belt.List.map(aList, aValue => toString(aValue))
      ->Extra.List.interperse(" ")
      ->Belt.List.toArray
      ->Js.String.concatMany("")})`
  | EValue(aValue) => ExpressionValue.toString(aValue)
  }

let toStringResult = codeResult =>
  switch codeResult {
  | Ok(a) => `Ok(${toString(a)})`
  | Error(m) => `Error(${Reducer_ErrorValue.errorToString(m)})`
  }

let inspect = (expr: expression): expression => {
  Js.log(toString(expr))
  expr
}

let inspectResult = (r: result<expression, Reducer_ErrorValue.errorValue>): result<
  expression,
  Reducer_ErrorValue.errorValue,
> => {
  Js.log(toStringResult(r))
  r
}
