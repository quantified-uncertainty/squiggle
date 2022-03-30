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
  Shows the Lisp Code as text lisp code
*/
let rec toString = expression =>
  switch expression {
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
  Converts a MathJs code to Lisp Code
*/
let parse_ = (expr: string, parser, converter): result<t, errorValue> =>
  expr->parser->Result.flatMap(node => converter(node))

let parse = (mathJsCode: string): result<t, errorValue> =>
  mathJsCode->parse_(MathJs.Parse.parse, MathJs.ToExpression.fromNode)

module MapString = Belt.Map.String
type bindings = MapString.t<unit>
let defaultBindings: bindings = MapString.fromArray([])
// TODO Define bindings for function execution context

/*
  After reducing each level of code tree, we have a value list to evaluate
*/
let reduceValueList = (valueList: list<expressionValue>): result<expressionValue, 'e> =>
  switch valueList {
  | list{EvSymbol(fName), ...args} => (fName, args->Belt.List.toArray)->BuiltIn.dispatch
  | _ => valueList->Belt.List.toArray->ExpressionValue.EvArray->Ok
  }

/*
  Recursively evaluate/reduce the code tree
*/
let rec reduceExpression = (expression: t, bindings): result<expressionValue, 'e> =>
  switch expression {
  | T.EValue(value) => value->Ok
  | T.EList(list) => {
      let racc: result<list<expressionValue>, 'e> = list->Belt.List.reduceReverse(Ok(list{}), (
        racc,
        each: expression,
      ) =>
        racc->Result.flatMap(acc => {
          each
          ->reduceExpression(bindings)
          ->Result.flatMap(newNode => {
            acc->Belt.List.add(newNode)->Ok
          })
        })
      )
      racc->Result.flatMap(acc => acc->reduceValueList)
    }
  }

let evalWBindingsExpression = (aExpression, bindings): result<expressionValue, 'e> =>
  reduceExpression(aExpression, bindings)

/*
  Evaluates MathJs code via Lisp using bindings and answers the result
*/
let evalWBindings = (codeText: string, bindings: bindings) => {
  parse(codeText)->Result.flatMap(code => code->evalWBindingsExpression(bindings))
}

/*
  Evaluates MathJs code via Lisp and answers the result
*/
let eval = (code: string) => evalWBindings(code, defaultBindings)
