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
  | T.EBindings(bindings) => "$$bound"
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

let defaultBindings: T.bindings = Belt.Map.String.empty

/*
  Recursively evaluate/reduce the expression (Lisp AST)
*/
let rec reduceExpression = (expression: t, bindings: T.bindings): result<expressionValue, 'e> => {
  /*
    After reducing each level of expression(Lisp AST), we have a value list to evaluate
 */
  let reduceValueList = (valueList: list<expressionValue>): result<expressionValue, 'e> =>
    switch valueList {
    | list{EvCall(fName), ...args} => (fName, args->Belt.List.toArray)->BuiltIn.dispatch
    | _ => valueList->Belt.List.toArray->ExpressionValue.EvArray->Ok
    }

  /*
    Macros are like functions but instead of taking values as parameters,
    they take expressions as parameters and return a new expression.
    Macros are used to define language building blocks. They are like Lisp macros.
 */
  let doMacroCall = (list: list<t>, bindings: T.bindings): result<t, 'e> => {
    let dispatchMacroCall = (list: list<t>, bindings: T.bindings): result<t, 'e> => {
      let rec replaceSymbols = (expression: t, bindings: T.bindings): result<t, errorValue> =>
        switch expression {
        | T.EValue(EvSymbol(aSymbol)) =>
          switch bindings->Belt.Map.String.get(aSymbol) {
          | Some(boundExpression) => boundExpression->Ok
          | None => RESymbolNotFound(aSymbol)->Error
          }
        | T.EValue(_) => expression->Ok
        | T.EBindings(_) => expression->Ok
        | T.EList(list) => {
            let racc = list->Belt.List.reduceReverse(Ok(list{}), (racc, each: expression) =>
              racc->Result.flatMap(acc => {
                each
                ->replaceSymbols(bindings)
                ->Result.flatMap(newNode => {
                  acc->Belt.List.add(newNode)->Ok
                })
              })
            )
            racc->Result.map(acc => acc->T.EList)
          }
        }

      let doBindStatement = (statement: t, bindings: T.bindings) => {
        switch statement {
        | T.EList(list{T.EValue(EvCall("$let")), T.EValue(EvSymbol(aSymbol)), expression}) => {
            let rNewExpression = replaceSymbols(expression, bindings)
            rNewExpression->Result.map(newExpression =>
              Belt.Map.String.set(bindings, aSymbol, newExpression)->T.EBindings
            )
          }
        | _ => REAssignmentExpected->Error
        }
      }

      let doBindExpression = (expression: t, bindings: T.bindings) => {
        switch expression {
        | T.EList(list{T.EValue(EvCall("$let")), ..._}) => REExpressionExpected->Error
        | _ => replaceSymbols(expression, bindings)
        }
      }

      switch list {
      | list{T.EValue(EvCall("$$bindings"))} => bindings->T.EBindings->Ok

      | list{T.EValue(EvCall("$$bindStatement")), T.EBindings(bindings), statement} =>
        doBindStatement(statement, bindings)
      | list{T.EValue(EvCall("$$bindExpression")), T.EBindings(bindings), expression} =>
        doBindExpression(expression, bindings)
      | _ => list->T.EList->Ok
      }
    }

    list->dispatchMacroCall(bindings)
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
    | _ => RETodo("Error: Bindings cannot be reduced to values")->Error
    }

  let rExpandedExpression: result<t, 'e> = expression->seekMacros(bindings)
  rExpandedExpression->Result.flatMap(expandedExpression =>
    expandedExpression->reduceExpandedExpression
  )
}

let evalWBindingsExpression = (aExpression, bindings): result<expressionValue, 'e> =>
  reduceExpression(aExpression, bindings)

/*
  Evaluates MathJs code via Reducer using bindings and answers the result
*/
let evalWBindings = (codeText: string, bindings: T.bindings) => {
  parse(codeText)->Result.flatMap(code => code->evalWBindingsExpression(bindings))
}

/*
  Evaluates MathJs code via Reducer and answers the result
*/
let eval = (code: string) => evalWBindings(code, defaultBindings)
