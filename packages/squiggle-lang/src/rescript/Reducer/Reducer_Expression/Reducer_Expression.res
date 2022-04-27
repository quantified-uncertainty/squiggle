module Builder = Reducer_Expression_Builder
module BuiltIn = Reducer_Dispatch_BuiltIn
module ExpressionValue = ReducerInterface.ExpressionValue
module Extra = Reducer_Extra
module MathJs = Reducer_MathJs
module Result = Belt.Result
module T = Reducer_Expression_T

open Reducer_ErrorValue

type environment = ReducerInterface_ExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue
type expression = T.expression
type expressionValue = ReducerInterface_ExpressionValue.expressionValue
type externalBindings = ReducerInterface_ExpressionValue.externalBindings
type internalCode = ReducerInterface_ExpressionValue.internalCode
type t = expression

external castExpressionToInternalCode: expression => internalCode = "%identity"
external castInternalCodeToExpression: internalCode => expression = "%identity"

/*
  Shows the expression as text of expression
*/
let rec toString = expression =>
  switch expression {
  | T.EBindings(_) => "$$bound"
  | T.EParameters(params) => `(${Js.Array2.toString(params)})`
  | T.EList(aList) =>
    `(${Belt.List.map(aList, aValue => toString(aValue))
      ->Extra.List.interperse(" ")
      ->Belt.List.toArray
      ->Js.String.concatMany("")})`
  | EValue(aValue) => ExpressionValue.toString(aValue)
  }

let toStringResult = codeResult =>
  switch codeResult {
  | Ok(a) => `Ok(${toString(a)})`
  | Error(m) => `Error(${Js.String.make(m)})`
  }

/*
  Converts a MathJs code to expression
*/
let parse_ = (expr: string, parser, converter): result<t, errorValue> =>
  expr->parser->Result.flatMap(node => converter(node))

let parse = (mathJsCode: string): result<t, errorValue> =>
  mathJsCode->parse_(MathJs.Parse.parse, MathJs.ToExpression.fromNode)

let parsePartial = (mathJsCode: string): result<t, errorValue> =>
  mathJsCode->parse_(MathJs.Parse.parse, MathJs.ToExpression.fromPartialNode)

let parseOuter = (mathJsCode: string): result<t, errorValue> =>
  mathJsCode->parse_(MathJs.Parse.parse, MathJs.ToExpression.fromOuterNode)

let defaultBindings: T.bindings = Belt.Map.String.empty

/*
  Recursively evaluate/reduce the expression (Lisp AST)
*/
let rec reduceExpression = (expression: t, bindings: T.bindings, environment: environment): result<
  expressionValue,
  'e,
> => {
  /*
    Macros are like functions but instead of taking values as parameters,
    they take expressions as parameters and return a new expression.
    Macros are used to define language building blocks. They are like Lisp macros.
 */
  let doMacroCall = (list: list<t>, bindings: T.bindings, environment: environment): result<
    t,
    'e,
  > =>
    Reducer_Dispatch_BuiltInMacros.dispatchMacroCall(list, bindings, environment, reduceExpression)

  let applyParametersToLambda = (
    internal: internalCode,
    parameters: array<string>,
    args: list<expressionValue>,
    environment,
  ): result<expressionValue, 'e> => {
    let expr = castInternalCodeToExpression(internal)
    let parameterList = parameters->Belt.List.fromArray
    let zippedParameterList = parameterList->Belt.List.zip(args)
    let bindings = Belt.List.reduce(zippedParameterList, defaultBindings, (a, (p, e)) =>
      a->Belt.Map.String.set(p, e->T.EValue)
    )
    let newExpression = Builder.passToFunction(
      "$$bindExpression",
      list{Builder.passToFunction("$$bindings", list{}), expr},
    )
    reduceExpression(newExpression, bindings, environment)
  }

  /*
    After reducing each level of expression(Lisp AST), we have a value list to evaluate
 */
  let reduceValueList = (valueList: list<expressionValue>, environment): result<
    expressionValue,
    'e,
  > =>
    switch valueList {
    | list{EvCall(fName), ...args} =>
      (fName, args->Belt.List.toArray)->BuiltIn.dispatch(environment)
    // "(lambda(x=>internal) param)"
    | list{EvLambda((parameters, internal)), ...args} =>
      applyParametersToLambda(internal, parameters, args, environment)
    | _ => valueList->Belt.List.toArray->ExpressionValue.EvArray->Ok
    }

  let rec seekMacros = (expression: t, bindings: T.bindings, environment): result<t, 'e> =>
    switch expression {
    | T.EValue(_value) => expression->Ok
    | T.EBindings(_value) => expression->Ok
    | T.EParameters(_value) => expression->Ok
    | T.EList(list) => {
        let racc: result<list<t>, 'e> = list->Belt.List.reduceReverse(Ok(list{}), (
          racc,
          each: expression,
        ) =>
          racc->Result.flatMap(acc => {
            each
            ->seekMacros(bindings, environment)
            ->Result.flatMap(newNode => {
              acc->Belt.List.add(newNode)->Ok
            })
          })
        )
        racc->Result.flatMap(acc => acc->doMacroCall(bindings, environment))
      }
    }

  let rec reduceExpandedExpression = (expression: t, environment): result<expressionValue, 'e> =>
    switch expression {
    | T.EList(list{T.EValue(EvCall("$lambda")), T.EParameters(parameters), functionDefinition}) =>
      EvLambda((parameters, functionDefinition->castExpressionToInternalCode))->Ok
    | T.EValue(value) => value->Ok
    | T.EList(list) => {
        let racc: result<list<expressionValue>, 'e> = list->Belt.List.reduceReverse(Ok(list{}), (
          racc,
          each: expression,
        ) =>
          racc->Result.flatMap(acc => {
            each
            ->reduceExpandedExpression(environment)
            ->Result.flatMap(newNode => {
              acc->Belt.List.add(newNode)->Ok
            })
          })
        )
        racc->Result.flatMap(acc => acc->reduceValueList(environment))
      }
    | EBindings(_bindings) => RETodo("Error: Bindings cannot be reduced to values")->Error
    | EParameters(_parameters) =>
      RETodo("Error: Lambda Parameters cannot be reduced to values")->Error
    }

  let rExpandedExpression: result<t, 'e> = expression->seekMacros(bindings, environment)
  rExpandedExpression->Result.flatMap(expandedExpression =>
    expandedExpression->reduceExpandedExpression(environment)
  )
}

let evalUsingExternalBindingsExpression_ = (aExpression, bindings, environment): result<
  expressionValue,
  'e,
> => reduceExpression(aExpression, bindings, environment)

/*
  Evaluates MathJs code via Reducer using bindings and answers the result.
  When bindings are used, the code is a partial code as if it is cut from a larger code.
  Therefore all statements are assignments.
*/
let evalPartial_ = (codeText: string, bindings: T.bindings, environment: environment) => {
  parsePartial(codeText)->Result.flatMap(expression =>
    expression->evalUsingExternalBindingsExpression_(bindings, environment)
  )
}

/*
  Evaluates MathJs code via Reducer using bindings and answers the result.
  When bindings are used, the code is a partial code as if it is cut from a larger code.
  Therefore all statments are assignments.
*/
let evalOuter_ = (codeText: string, bindings: T.bindings, environment: environment) => {
  parseOuter(codeText)->Result.flatMap(expression =>
    expression->evalUsingExternalBindingsExpression_(bindings, environment)
  )
}

let externalBindingsToBindings = (externalBindings: externalBindings): T.bindings => {
  let keys = Js.Dict.keys(externalBindings)
  keys->Belt.Array.reduce(defaultBindings, (acc, key) => {
    let value = Js.Dict.unsafeGet(externalBindings, key)
    acc->Belt.Map.String.set(key, T.EValue(value))
  })
}

let evaluateUsingOptions = (
  ~environment: option<ReducerInterface_ExpressionValue.environment>,
  ~externalBindings: option<ReducerInterface_ExpressionValue.externalBindings>,
  ~isPartial: option<bool>,
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

  let anIsPartial = switch isPartial {
  | Some(isPartial) => isPartial
  | None => false
  }

  let bindings = anExternalBindings->externalBindingsToBindings

  if anIsPartial {
    evalPartial_(code, bindings, anEnvironment)
  } else {
    evalOuter_(code, bindings, anEnvironment)
  }
}

/*
  Evaluates MathJs code and bindings via Reducer and answers the result
*/
let evaluate = (code: string): result<expressionValue, errorValue> => {
  evaluateUsingOptions(~environment=None, ~externalBindings=None, ~isPartial=None, code)
}
let eval = evaluate
