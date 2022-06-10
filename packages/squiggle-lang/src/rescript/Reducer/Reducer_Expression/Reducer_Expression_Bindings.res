module ErrorValue = Reducer_ErrorValue
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module Result = Belt.Result
module BindingsManager = Reducer_Manager_Bindings

type errorValue = Reducer_ErrorValue.errorValue
type expression = ExpressionT.expression
type expressionValue = ExpressionValue.expressionValue
type externalBindings = ReducerInterface_ExpressionValue.externalBindings

let emptyBindings = Reducer_Manager_Bindings.emptyBindings

let typeAliasesKey = BindingsManager.typeAliasesKey
let typeReferencesKey = BindingsManager.typeReferencesKey

let toExternalBindings = (bindings: ExpressionT.bindings): externalBindings =>
  BindingsManager.toRecord(bindings)

let fromExternalBindings = (externalBindings: externalBindings): ExpressionT.bindings =>
  BindingsManager.fromRecord(externalBindings)

let fromValue = (aValue: expressionValue) => BindingsManager.fromExpressionValue(aValue)

let isMacroName = (fName: string): bool => fName->Js.String2.startsWith("$$")

let rec replaceSymbols = (bindings: ExpressionT.bindings, expression: expression): result<
  expression,
  errorValue,
> =>
  switch expression {
  | ExpressionT.EValue(value) =>
    replaceSymbolOnValue(bindings, value)->Result.map(evValue => evValue->ExpressionT.EValue)
  | ExpressionT.EList(list) =>
    switch list {
    | list{EValue(EvCall(fName)), ..._args} =>
      switch isMacroName(fName) {
      // A macro reduces itself so we dont dive in it
      | true => expression->Ok
      | false => replaceSymbolsOnExpressionList(bindings, list)
      }
    | _ => replaceSymbolsOnExpressionList(bindings, list)
    }
  }

and replaceSymbolsOnExpressionList = (bindings, list) => {
  let racc = list->Belt.List.reduceReverse(Ok(list{}), (racc, each: expression) =>
    racc->Result.flatMap(acc => {
      replaceSymbols(bindings, each)->Result.flatMap(newNode => {
        acc->Belt.List.add(newNode)->Ok
      })
    })
  )
  racc->Result.map(acc => acc->ExpressionT.EList)
}
and replaceSymbolOnValue = (bindings, evValue: expressionValue) =>
  switch evValue {
  | EvSymbol(symbol) => Belt.Map.String.getWithDefault(bindings, symbol, evValue)->Ok
  | EvCall(symbol) => Belt.Map.String.getWithDefault(bindings, symbol, evValue)->checkIfCallable
  | _ => evValue->Ok
  }
and checkIfCallable = (evValue: expressionValue) =>
  switch evValue {
  | EvCall(_) | EvLambda(_) => evValue->Ok
  | _ => ErrorValue.RENotAFunction(ExpressionValue.toString(evValue))->Error
  }

let toString = (bindings: ExpressionT.bindings) =>
  bindings->toExternalBindings->ExpressionValue.EvRecord->ExpressionValue.toString

let externalBindingsToString = (externalBindings: externalBindings) =>
  externalBindings->ExpressionValue.EvRecord->ExpressionValue.toString
