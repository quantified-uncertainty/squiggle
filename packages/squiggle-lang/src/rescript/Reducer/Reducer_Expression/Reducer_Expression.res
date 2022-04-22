module BuiltIn = Reducer_Dispatch_BuiltIn
module ExpressionValue = ReducerInterface.ExpressionValue
module Extra = Reducer_Extra
module MathJs = Reducer_MathJs
module Result = Belt.Result
module T = Reducer_Expression_T
open Reducer_ErrorValue

type expression = T.expression
type expressionValue = ExpressionValue.expressionValue
type t = expression

/*
  Shows the expression as text of expression
*/
let rec toString = expression =>
  switch expression {
  | T.EBindings(_) => "$$bound"
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
let rec reduceExpression = (expression: t, bindings: T.bindings): result<expressionValue, 'e> => {
  /*
    Macros are like functions but instead of taking values as parameters,
    they take expressions as parameters and return a new expression.
    Macros are used to define language building blocks. They are like Lisp macros.
 */
  let doMacroCall = (list: list<t>, bindings: T.bindings): result<t, 'e> =>
    Reducer_Dispatch_BuiltInMacros.dispatchMacroCall(list, bindings, reduceExpression)

  /*
    After reducing each level of expression(Lisp AST), we have a value list to evaluate
 */
  let reduceValueList = (valueList: list<expressionValue>): result<expressionValue, 'e> =>
    switch valueList {
    | list{EvCall(fName), ...args} => (fName, args->Belt.List.toArray)->BuiltIn.dispatch
    | _ => valueList->Belt.List.toArray->ExpressionValue.EvArray->Ok
    }

  let rec seekMacros = (expression: t, bindings: T.bindings): result<t, 'e> =>
    switch expression {
    | T.EValue(_value) => expression->Ok
    | T.EBindings(_value) => expression->Ok
    | T.EList(list) => {
        let racc: result<list<t>, 'e> = list->Belt.List.reduceReverse(Ok(list{}), (
          racc,
          each: expression,
        ) =>
          racc->Result.flatMap(acc => {
            each
            ->seekMacros(bindings)
            ->Result.flatMap(newNode => {
              acc->Belt.List.add(newNode)->Ok
            })
          })
        )
        racc->Result.flatMap(acc => acc->doMacroCall(bindings))
      }
    }

  let rec reduceExpandedExpression = (expression: t): result<expressionValue, 'e> =>
    switch expression {
    | T.EValue(value) => value->Ok
    | T.EList(list) => {
        let racc: result<list<expressionValue>, 'e> = list->Belt.List.reduceReverse(Ok(list{}), (
          racc,
          each: expression,
        ) =>
          racc->Result.flatMap(acc => {
            each
            ->reduceExpandedExpression
            ->Result.flatMap(newNode => {
              acc->Belt.List.add(newNode)->Ok
            })
          })
        )
        racc->Result.flatMap(acc => acc->reduceValueList)
      }
    | EBindings(_bindings) => RETodo("Error: Bindings cannot be reduced to values")->Error
    }

  let rExpandedExpression: result<t, 'e> = expression->seekMacros(bindings)
  rExpandedExpression->Result.flatMap(expandedExpression =>
    expandedExpression->reduceExpandedExpression
  )
}

let evalWBindingsExpression_ = (aExpression, bindings): result<expressionValue, 'e> =>
  reduceExpression(aExpression, bindings)

/*
  Evaluates MathJs code via Reducer using bindings and answers the result.
  When bindings are used, the code is a partial code as if it is cut from a larger code.
  Therefore all statments are assignments.
*/
let evalPartialWBindings_ = (codeText: string, bindings: T.bindings) => {
  parsePartial(codeText)->Result.flatMap(expression =>
    expression->evalWBindingsExpression_(bindings)
  )
}

/*
  Evaluates MathJs code via Reducer using bindings and answers the result.
  When bindings are used, the code is a partial code as if it is cut from a larger code.
  Therefore all statments are assignments.
*/
let evalOuterWBindings_ = (codeText: string, bindings: T.bindings) => {
  parseOuter(codeText)->Result.flatMap(expression => expression->evalWBindingsExpression_(bindings))
}

/*
  Evaluates MathJs code and bindings via Reducer and answers the result
*/
let eval = (codeText: string) => {
  parse(codeText)->Result.flatMap(expression =>
    expression->evalWBindingsExpression_(defaultBindings)
  )
}

type externalBindings = ReducerInterface.ExpressionValue.externalBindings //Js.Dict.t<expressionValue>

let externalBindingsToBindings = (externalBindings: externalBindings): T.bindings => {
  let keys = Js.Dict.keys(externalBindings)
  keys->Belt.Array.reduce(defaultBindings, (acc, key) => {
    let value = Js.Dict.unsafeGet(externalBindings, key)
    acc->Belt.Map.String.set(key, T.EValue(value))
  })
}
/*
  Evaluates code with external bindings. External bindings are a record of expression values.
*/
let evalWBindings = (code: string, externalBindings: externalBindings) => {
  let bindings = externalBindings->externalBindingsToBindings
  evalOuterWBindings_(code, bindings)
}

/*
  Evaluates code with external bindings. External bindings are a record of expression values.
  The code is a partial code as if it is cut from a larger code. Therefore all statments are assignments.
*/
let evalPartialWBindings = (code: string, externalBindings: externalBindings): result<
  externalBindings,
  'e,
> => {
  let bindings = externalBindings->externalBindingsToBindings
  let answer = evalPartialWBindings_(code, bindings)
  answer->Result.flatMap(answer =>
    switch answer {
    | EvRecord(aRecord) => Ok(aRecord)
    | _ => RETodo("TODO: External bindings must be returned")->Error
    }
  )
}
