/*
  An expression is an intermediate representation of a Squiggle code.
  Expressions are evaluated by `Reducer_Expression.evaluate` function.
*/
type t = Reducer_T.expression

let commaJoin = values => values->Reducer_Extra_Array.intersperse(", ")->Js.String.concatMany("")
let semicolonJoin = values =>
  values->Reducer_Extra_Array.intersperse("; ")->Js.String.concatMany("")

/*
  Converts the expression to String
*/
let rec toString = (expression: t) =>
  switch expression.content {
  | EBlock(statements) =>
    `{${Js.Array2.map(statements, aValue => toString(aValue))->semicolonJoin}}`
  | EProgram(statements) => Js.Array2.map(statements, aValue => toString(aValue))->semicolonJoin
  | EArray(aList) => `[${Js.Array2.map(aList, aValue => toString(aValue))->commaJoin}]`
  | ERecord(map) =>
    `{${map->Belt.Array.map(((key, value)) => `${key->toString}: ${value->toString}`)->commaJoin}}`
  | ESymbol(name) => name
  | ETernary(predicate, trueCase, falseCase) =>
    `${predicate->toString} ? (${trueCase->toString}) : (${falseCase->toString})`
  | EAssign(name, value) => `${name} = ${value->toString}`
  | ECall(fn, args) => `(${fn->toString})(${args->Js.Array2.map(toString)->commaJoin})`
  | ELambda(parameters, body) => `{|${parameters->commaJoin}| ${body->toString}}`
  | EValue(aValue) => Reducer_Value.toString(aValue)
  }

let toStringResult = codeResult =>
  switch codeResult {
  | Ok(a) => `Ok(${toString(a)})`
  | Error(m) => `Error(${Reducer_ErrorValue.errorValueToString(m)})`
  }

let toStringResultOkless = codeResult =>
  switch codeResult {
  | Ok(a) => toString(a)
  | Error(m) => `Error(${Reducer_ErrorValue.errorValueToString(m)})`
  }

let inspect = (expr: t): t => {
  Js.log(toString(expr))
  expr
}

let inspectResult = (r: result<t, Reducer_ErrorValue.errorValue>): result<
  t,
  Reducer_ErrorValue.errorValue,
> => {
  Js.log(toStringResult(r))
  r
}

let resultToValue = (rExpression: result<t, Reducer_ErrorValue.t>): t =>
  switch rExpression {
  | Ok(expression) => expression
  | Error(errorValue) => Reducer_ErrorValue.toException(errorValue)
  }
