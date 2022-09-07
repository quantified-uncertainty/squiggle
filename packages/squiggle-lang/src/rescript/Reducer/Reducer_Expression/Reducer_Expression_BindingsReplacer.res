module ErrorValue = Reducer_ErrorValue
module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Bindings = Reducer_Bindings

type errorValue = Reducer_ErrorValue.errorValue
type expression = ExpressionT.expression
type internalExpressionValue = InternalExpressionValue.t

let isMacroName = (fName: string): bool => fName->Js.String2.startsWith("$$")

let rec replaceSymbols = (bindings: ExpressionT.bindings, expression: expression): expression =>
  switch expression {
  | ExpressionT.EValue(value) =>
    replaceSymbolOnValue(bindings, value)->ExpressionT.EValue
  | ExpressionT.EList(list) =>
    switch list {
    | list{EValue(IEvCall(fName)), ..._args} =>
      switch isMacroName(fName) {
      // A macro reduces itself so we dont dive in it
      | true => expression
      | false => replaceSymbolsOnExpressionList(bindings, list)
      }
    | _ => replaceSymbolsOnExpressionList(bindings, list)
    }
  }

and replaceSymbolsOnExpressionList = (bindings, list) => {
  let racc = list->Belt.List.reduceReverse(list{}, (acc, each: expression) =>
    replaceSymbols(bindings, each)->Belt.List.add(acc, _)
  )
  ExpressionT.EList(racc)
}
and replaceSymbolOnValue = (bindings, evValue: internalExpressionValue) =>
  switch evValue {
  | IEvSymbol(symbol) => Bindings.getWithDefault(bindings, symbol, evValue)
  | IEvCall(symbol) => Bindings.getWithDefault(bindings, symbol, evValue)->checkIfCallable
  | _ => evValue
  }
and checkIfCallable = (evValue: internalExpressionValue) =>
  switch evValue {
  | IEvCall(_) | IEvLambda(_) => evValue
  | _ => raise(ErrorValue.ErrorException(ErrorValue.RENotAFunction(InternalExpressionValue.toString(evValue))))
  }
