module ErrorValue = Reducer_ErrorValue
module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Result = Belt.Result
module Module = Reducer_Category_Module

type errorValue = Reducer_ErrorValue.errorValue
type expression = ExpressionT.expression
type internalExpressionValue = InternalExpressionValue.t
type externalBindings = ReducerInterface_ExternalExpressionValue.externalBindings

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
    | list{EValue(IEvCall(fName)), ..._args} =>
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
and replaceSymbolOnValue = (bindings, evValue: internalExpressionValue) =>
  switch evValue {
  | IEvSymbol(symbol) => Module.getWithDefault(bindings, symbol, evValue)->Ok
  | IEvCall(symbol) => Module.getWithDefault(bindings, symbol, evValue)->checkIfCallable
  | _ => evValue->Ok
  }
and checkIfCallable = (evValue: internalExpressionValue) =>
  switch evValue {
  | IEvCall(_) | IEvLambda(_) => evValue->Ok
  | _ => ErrorValue.RENotAFunction(InternalExpressionValue.toString(evValue))->Error
  }
