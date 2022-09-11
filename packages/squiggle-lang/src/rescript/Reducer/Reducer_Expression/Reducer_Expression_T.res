/*
  An expression is a Lisp AST. An expression is either a primitive value or a list of expressions.
  In the case of a list of expressions (e1, e2, e3, ...eN), the semantic is
     apply e1, e2 -> apply e3 -> ... -> apply eN
  This is Lisp semantics. It holds true in both eager and lazy evaluations.
  A Lisp AST contains only expressions/primitive values to apply to their left.
  The act of defining the semantics of a functional language is to write it in terms of Lisp AST.
*/
module Extra = Reducer_Extra
module InternalExpressionValue = ReducerInterface_InternalExpressionValue

type internalExpressionValue = Reducer_T.value
type environment = Reducer_T.environment

type expression = Reducer_T.expression

type t = expression

type context = Reducer_T.context

type reducerFn = Reducer_T.reducerFn

let commaJoin = values => values->Reducer_Extra_Array.intersperse(", ")->Js.String.concatMany("")

/*
  Converts the expression to String
*/
let rec toString = (expression: expression) =>
  switch expression {
  | EBlock(statements) =>
    `{${Js.Array2.map(statements, aValue => toString(aValue))->commaJoin}}`
  | EProgram(statements) =>
    `<${Js.Array2.map(statements, aValue => toString(aValue))->commaJoin}>`
  | EArray(aList) =>
    `[${Js.Array2.map(aList, aValue => toString(aValue))->commaJoin}]`
  | ERecord(map) => "TODO"
  | ESymbol(name) => name
  | ETernary(predicate, trueCase, falseCase) => `${predicate->toString} ? (${trueCase->toString}) : (${falseCase->toString})`
  | EAssign(name, value) => `${name} = ${value->toString}`
  | ECall(fn, args) => `(${fn->toString})(${args->Js.Array2.map(toString)->commaJoin})`
  | ELambda(parameters, body) => `{|${parameters->commaJoin}| ${body->toString}}`
  | EValue(aValue) => InternalExpressionValue.toString(aValue)
  }

let toStringResult = codeResult =>
  switch codeResult {
  | Ok(a) => `Ok(${toString(a)})`
  | Error(m) => `Error(${Reducer_ErrorValue.errorToString(m)})`
  }

let toStringResultOkless = codeResult =>
  switch codeResult {
  | Ok(a) => toString(a)
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

type ffiFn = (
  array<internalExpressionValue>,
  environment,
) => result<internalExpressionValue, Reducer_ErrorValue.errorValue>

type optionFfiFn = (array<internalExpressionValue>, environment) => option<internalExpressionValue>
type optionFfiFnReturningResult = (
  array<internalExpressionValue>,
  environment,
) => option<result<internalExpressionValue, Reducer_ErrorValue.errorValue>>

type expressionOrFFI =
  | NotFFI(expression)
  | FFI(ffiFn)
