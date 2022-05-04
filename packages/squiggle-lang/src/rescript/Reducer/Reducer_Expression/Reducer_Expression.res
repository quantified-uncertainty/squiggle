module Bindings = Reducer_Expression_Bindings
module BuiltIn = Reducer_Dispatch_BuiltIn
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionValue = ReducerInterface.ExpressionValue
module Extra = Reducer_Extra
module Lambda = Reducer_Expression_Lambda
module Macro = Reducer_Expression_Macro
module MathJs = Reducer_MathJs
module Result = Belt.Result
module T = Reducer_Expression_T

type environment = ReducerInterface_ExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue
type expression = T.expression
type expressionValue = ReducerInterface_ExpressionValue.expressionValue
type externalBindings = ReducerInterface_ExpressionValue.externalBindings
type internalCode = ReducerInterface_ExpressionValue.internalCode
type t = expression

/*
  Converts a MathJs code to expression
*/
let parse_ = (expr: string, parser, converter): result<t, errorValue> =>
  expr->parser->Result.flatMap(node => converter(node))

let parse = (mathJsCode: string): result<t, errorValue> =>
  mathJsCode->parse_(MathJs.Parse.parse, MathJs.ToExpression.fromNode)

/*
  Recursively evaluate/reduce the expression (Lisp AST)
*/
let rec reduceExpression = (expression: t, bindings: T.bindings, environment: environment): result<
  expressionValue,
  'e,
> => {
  // Js.log(`reduce: ${T.toString(expression)} bindings: ${bindings->Bindings.toString}`)
  switch expression {
  | T.EValue(value) => value->Ok
  | T.EList(list) =>
    switch list {
    | list{EValue(EvCall(fName)), ..._args} =>
      switch Macro.isMacroName(fName) {
      // A macro expands then reduces itself
      | true => Macro.doMacroCall(expression, bindings, environment, reduceExpression)
      | false => reduceExpressionList(list, bindings, environment)
      }
    | _ => reduceExpressionList(list, bindings, environment)
    }
  }
}

and reduceExpressionList = (
  expressions: list<t>,
  bindings: T.bindings,
  environment: environment,
): result<expressionValue, 'e> => {
  let racc: result<list<expressionValue>, 'e> = expressions->Belt.List.reduceReverse(Ok(list{}), (
    racc,
    each: expression,
  ) =>
    racc->Result.flatMap(acc => {
      each
      ->reduceExpression(bindings, environment)
      ->Result.map(newNode => {
        acc->Belt.List.add(newNode)
      })
    })
  )
  racc->Result.flatMap(acc => acc->reduceValueList(environment))
}

/*
    After reducing each level of expression(Lisp AST), we have a value list to evaluate
 */
and reduceValueList = (valueList: list<expressionValue>, environment): result<
  expressionValue,
  'e,
> =>
  switch valueList {
  | list{EvCall(fName), ...args} =>
    (fName, args->Belt.List.toArray)->BuiltIn.dispatch(environment, reduceExpression)

  | list{EvLambda(lamdaCall), ...args} =>
    Lambda.doLambdaCall(lamdaCall, args, environment, reduceExpression)
  | _ =>
    valueList
    ->Lambda.checkIfReduced
    ->Result.flatMap(reducedValueList =>
      reducedValueList->Belt.List.toArray->ExpressionValue.EvArray->Ok
    )
  }

let evalUsingBindingsExpression_ = (aExpression, bindings, environment): result<
  expressionValue,
  'e,
> => reduceExpression(aExpression, bindings, environment)

let evaluateUsingOptions = (
  ~environment: option<ReducerInterface_ExpressionValue.environment>,
  ~externalBindings: option<ReducerInterface_ExpressionValue.externalBindings>,
  code: string,
): result<expressionValue, errorValue> => {
  let anEnvironment = switch environment {
  | Some(env) => env
  | None => ReducerInterface_ExpressionValue.defaultEnvironment
  }

  let anExternalBindings = switch externalBindings {
  | Some(bindings) => bindings
  | None => ReducerInterface_ExpressionValue.defaultExternalBindings
  }

  let bindings = anExternalBindings->Bindings.fromExternalBindings

  parse(code)->Result.flatMap(expr => evalUsingBindingsExpression_(expr, bindings, anEnvironment))
}

/*
  Evaluates MathJs code and bindings via Reducer and answers the result
*/
let evaluate = (code: string): result<expressionValue, errorValue> => {
  evaluateUsingOptions(~environment=None, ~externalBindings=None, code)
}
let eval = evaluate
let evaluatePartialUsingExternalBindings = (
  code: string,
  externalBindings: ReducerInterface_ExpressionValue.externalBindings,
  environment: ReducerInterface_ExpressionValue.environment,
): result<externalBindings, errorValue> => {
  let rAnswer = evaluateUsingOptions(
    ~environment=Some(environment),
    ~externalBindings=Some(externalBindings),
    code,
  )
  switch rAnswer {
  | Ok(EvRecord(externalBindings)) => Ok(externalBindings)
  | Ok(_) =>
    Error(Reducer_ErrorValue.RESyntaxError(`Partials must end with an assignment or record`))
  | Error(err) => err->Error
  }
}
